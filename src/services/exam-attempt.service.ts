import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST, SCHEDULE_JOB_NAME } from '../constants/constants';
import {
  IAnswerInExamAttempt,
  ICreateExamAttempt,
  IFilterExamAttempt,
  IPagination,
  ISaveAnswerExamAttempt,
} from '../interfaces';
import { Choices, ExamAttempts, Exams, Questions, Users } from '../models';
import { AppError } from '../utility/appError.util';
import { areArraysEqual, escapeForILike } from '../utility/utils';
import { ScheduleService } from '../modules';

export class ExamAttemptService {
  private static instance: ExamAttemptService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(
    data: CreationAttributes<ExamAttempts>,
    transaction?: Transaction,
  ) {
    const exam_attempt = await ExamAttempts.create(data, { transaction });
    const scheduleService = ScheduleService.getInstance();
    const job = await scheduleService.addJob(
      SCHEDULE_JOB_NAME.SUBMIT_EXAM,
      { id: exam_attempt.id },
      {
        delay: 1000,
        attempts: 3,
        removeOnComplete: true,
      },
    );
    await exam_attempt.update({ job_schedule_id: job.id }, { transaction });
    return exam_attempt;
  }

  // get many
  async getMany(filter: IFilterExamAttempt, paging: IPagination) {
    const { query: query_for_user, is_required: required_for_user } =
      this.buildQueryUser(filter);
    const { query: query_for_exam, is_required: required_for_exam } =
      this.buildQueryExam(filter);
    return await ExamAttempts.findAndCountAll({
      where: this.buildQuery(filter),
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url'],
          where: query_for_user,
          required: required_for_user,
        },
        {
          model: Exams,
          as: 'exam',
          attributes: ['id', 'title'],
          where: query_for_exam,
          required: required_for_exam,
        },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });
  }

  // get one
  async findByPk(id: number, transaction?: Transaction) {
    return await ExamAttempts.findByPk(id, {
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
            'lastest_start_time',
            'total_question',
            'list_question',
            'title',
            'note',
            'id',
          ],
          required: true,
        },
      ],
      transaction,
    });
  }

  async detailExam(exam_id: number, user_id: number) {
    const exam_attempt = await this.findOrFail(exam_id, user_id);
    this.checkExamNotClosed(exam_attempt);

    return await this.buildExamDetail(exam_attempt, false);
  }

  async detailAfterSubmit(id: number, user_id: number) {
    const exam_attempt = await this.findOrFail(id);
    if (
      user_id !== exam_attempt.user_id &&
      user_id != exam_attempt.exam.creator_id
    ) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_unauthorized_access');
    }
    if (
      user_id !== exam_attempt.exam.creator_id &&
      exam_attempt.exam.lastest_start_time
    ) {
      const now = new Date();
      const lastest_start_time = new Date(exam_attempt.exam.lastest_start_time);
      if (now.getTime() < lastest_start_time.getTime()) {
        throw new AppError(BAD_REQUEST, 'access_blocked_until_end');
      }
    }

    return await this.buildExamDetail(exam_attempt, true);
  }

  async getOnGoingExam(data: ICreateExamAttempt, user_id: number) {
    return await ExamAttempts.findOne({
      where: { user_id, exam_id: data.exam_id, finished_at: null },
      attributes: ['id'],
    });
  }

  // find or fail
  async findOrFail(
    exam_attempt_id: number,
    user_id?: number,
    transaction?: Transaction,
  ) {
    const exam_attempt = await this.findByPk(exam_attempt_id, transaction);
    if (!exam_attempt || (user_id && user_id !== exam_attempt.user_id)) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_not_found');
    }
    return exam_attempt;
  }

  // update
  async saveAnswer(
    data: ISaveAnswerExamAttempt,
    exam_attempt_id: number,
    user_id: number,
    transaction?: Transaction,
  ) {
    const exam_attempt = await this.findOrFail(
      exam_attempt_id,
      user_id,
      transaction,
    );
    this.checkExamNotClosed(exam_attempt);

    const map_question_to_choice = new Map();
    data.list_answer.map((answer) =>
      map_question_to_choice.set(answer.question_id, answer.choice_id),
    );
    const list_answer_db = exam_attempt.list_answer.map((answer_db) => {
      answer_db.choice_id =
        map_question_to_choice.get(answer_db.question_id) ?? null;
      return answer_db;
    });
    exam_attempt.set({ list_answer: list_answer_db });
    exam_attempt.changed('list_answer', true);
    await exam_attempt.save({ transaction });

    return exam_attempt;
  }

  async submit(
    data: ISaveAnswerExamAttempt,
    exam_attempt_id: number,
    user_id: number,
    transaction?: Transaction,
  ) {
    const finished_at = new Date();
    // save answer
    const exam_attempt_db = await this.saveAnswer(
      data,
      exam_attempt_id,
      user_id,
      transaction,
    );

    exam_attempt_db.set({ finished_at });
    const exam_attempt = await this.gradingExam(exam_attempt_db, transaction);
    return {
      ...exam_attempt.dataValues,
      exam: _.pick(exam_attempt.exam, ['title', 'note', 'id']),
    };
  }

  async submitBySystem(exam_attempt_id: number) {
    const finished_at = new Date();
    const exam_attempt = await this.findOrFail(exam_attempt_id, undefined);
    this.checkExamNotClosed(exam_attempt);

    exam_attempt.set({ finished_at });
    await this.gradingExam(exam_attempt);
  }

  // validate
  private checkExamNotClosed(exam_attempt: ExamAttempts) {
    const now = new Date();
    const expireTime = new Date(exam_attempt.started_at);
    expireTime.setMinutes(expireTime.getMinutes() + exam_attempt.duration + 1);

    if (exam_attempt.finished_at || now > expireTime) {
      throw new AppError(BAD_REQUEST, 'exam_submission_closed');
    }
  }

  // helper
  private buildQuery(filter: IFilterExamAttempt) {
    const query: any = {};
    if (filter.is_finished) {
      query.finished_at = { [Op.ne]: null };
    }
    return query;
  }

  private buildQueryUser(filter: IFilterExamAttempt) {
    const query: any = {};
    let is_required = false;
    if (filter.user_id) {
      query.id = _.toSafeInteger(filter.user_id);
      is_required = true;
    }
    if (filter.username) {
      query.username = { [Op.like]: escapeForILike(filter.username) };
      is_required = true;
    }
    return { query, is_required };
  }

  private buildQueryExam(filter: IFilterExamAttempt) {
    const query: any = {};
    let is_required = false;
    if (filter.exam_id) {
      query.id = _.toSafeInteger(filter.exam_id);
      is_required = true;
    }
    if (filter.title) {
      query.title = { [Op.like]: escapeForILike(filter.title) };
      is_required = true;
    }
    return { query, is_required };
  }

  private buildQuestionChoiceMap(
    list_answer: { question_id: number; choice_id?: number }[] = [],
  ) {
    const map = new Map<number, number[]>();
    for (const { question_id, choice_id } of list_answer) {
      if (!map.has(question_id)) map.set(question_id, []);
      if (choice_id) map.get(question_id)!.push(choice_id);
    }
    return map;
  }

  private buildQuestionOrderMap(
    list_answer: { question_id: number; order: number }[] = [],
  ) {
    const map = new Map<number, number>();
    for (const { question_id, order } of list_answer) {
      map.set(question_id, order);
    }
    return map;
  }

  private buildQuestionScoreMap(
    list_question: { question_id: number; score: number }[] = [],
  ) {
    const map = new Map<number, number>();
    for (const { question_id, score } of list_question) {
      map.set(question_id, score);
    }
    return map;
  }

  private async buildExamDetail(
    exam_attempt: ExamAttempts,
    after_submit: boolean,
  ) {
    const map_question_to_choice = this.buildQuestionChoiceMap(
        exam_attempt.list_answer,
      ),
      map_question_to_order = this.buildQuestionOrderMap(
        exam_attempt.list_answer,
      ),
      map_question_to_score = this.buildQuestionScoreMap(
        exam_attempt.exam.list_question,
      );

    const list_question_id = exam_attempt.exam.list_question.map(
      (q) => q.question_id,
    );
    const list_question_db = await Questions.findAll({
      where: { id: { [Op.in]: list_question_id } },
      include: [
        {
          model: Choices,
          as: 'choices',
          attributes: ['id', 'content', 'is_correct'],
        },
      ],
      attributes: ['id', 'content', 'description', 'type'],
    });

    const list_question = list_question_db.map((q) => ({
      id: q.id,
      content: q.content,
      description: q.description,
      type: q.type,
      score: map_question_to_score.get(q.id),
      order: map_question_to_order.get(q.id),
      choices: q.choices.map((choice) => ({
        id: choice.id,
        content: choice.content,
        is_selected:
          map_question_to_choice.get(q.id)?.includes(choice.id) ?? false,
        ...(after_submit ? { is_correct: choice.is_correct } : {}),
      })),
    }));

    return {
      ..._.pick(exam_attempt, [
        'id',
        'exam_id',
        'user_id',
        'started_at',
        'duration',
      ]),
      exam: _.pick(exam_attempt.exam, ['title', 'note', 'id']),
      list_question,
    };
  }

  // other
  async processCreateData(data: ICreateExamAttempt, user_id: number) {
    const exam = await Exams.findByPk(data.exam_id);
    if (!exam) {
      throw new AppError(BAD_REQUEST, 'exam_not_found');
    }

    const started_at = new Date();
    // check user can doing exam ?
    if (exam.creator_id !== user_id) {
      if (
        exam.lastest_start_time &&
        started_at.getTime() >= exam.lastest_start_time.getTime()
      ) {
        throw new AppError(BAD_REQUEST, 'overdue_doing_exam');
      }
      const count_exampt_attempt = await ExamAttempts.count({
        where: { exam_id: data.exam_id, user_id: user_id },
      });
      if (exam.max_attempt && count_exampt_attempt >= exam.max_attempt) {
        throw new AppError(BAD_REQUEST, 'no_more_turns');
      }
    }

    const list_question_id = exam.list_question.map(
      (question) => question.question_id,
    );
    const list_question_db = await Questions.findAll({
      where: { id: { [Op.in]: list_question_id } },
      include: [
        {
          model: Choices,
          as: 'choices',
          attributes: ['content', 'is_correct', 'id', 'explanation'],
        },
      ],
      attributes: ['content', 'description', 'score', 'id', 'type'],
    });

    const list_question_in_exam = _.shuffle(exam.list_question);
    const list_answer: IAnswerInExamAttempt[] = [];
    const list_question = [];

    for (const [index, question_in_exam] of list_question_in_exam.entries()) {
      const { question_id, score } = question_in_exam;
      const question_db = list_question_db.find(
        (question) => question.id === question_id,
      );
      if (!question_db) {
        throw new AppError(BAD_REQUEST, 'exist_invalid_question');
      }
      list_answer.push({
        question_id,
        order: index + 1,
      });
      const choices = question_db.choices.map((choice) => ({
        id: choice.id,
        content: choice.content,
      }));
      list_question.push({
        id: question_id,
        content: question_db.content,
        description: question_db.description,
        score,
        type: question_db.type,
        order: index + 1,
        choices,
      });
    }
    return {
      processedData: {
        user_id,
        exam_id: data.exam_id,
        duration: exam.duration,
        started_at,
        list_answer,
      },
      list_question,
      exam: {
        title: exam.title,
        note: exam.note,
      },
    };
  }

  async gradingExam(exam_attempt: ExamAttempts, transaction?: Transaction) {
    const map_question_to_choice = this.buildQuestionChoiceMap(
        exam_attempt.list_answer,
      ),
      map_question_to_score = this.buildQuestionScoreMap(
        exam_attempt.exam.list_question,
      );

    const list_question_id = exam_attempt.exam.list_question.map(
      (q) => q.question_id,
    );
    const list_question = await Questions.findAll({
      where: { id: { [Op.in]: list_question_id } },
      include: [
        {
          model: Choices,
          as: 'choices',
          attributes: ['is_correct', 'id'],
          where: {
            is_correct: true,
          },
        },
      ],
      attributes: ['id'],
    });

    let correct_question = 0,
      wrong_question = 0,
      score = 0;

    for (const question of list_question) {
      const list_correct_choice_id = question.choices.map(
        (choice) => choice.id,
      );
      const list_selected_choice_id =
        map_question_to_choice.get(question.id) ?? [];
      if (
        list_selected_choice_id.length === 0 ||
        list_correct_choice_id.length === 0
      )
        continue;
      if (areArraysEqual(list_correct_choice_id, list_selected_choice_id)) {
        correct_question++;
        score += map_question_to_score.get(question.id) ?? question.score;
      } else {
        wrong_question++;
      }
    }

    exam_attempt.set({
      total_question: list_question.length,
      correct_question,
      wrong_question,
      score,
    });
    await exam_attempt.save({ transaction });
    return exam_attempt;
  }
}
