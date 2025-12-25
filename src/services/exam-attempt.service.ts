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
    // Schedule auto-submit after duration (in minutes) converted to milliseconds
    // duration is in minutes, so multiply by 60 * 1000 to get milliseconds
    const delayMs = exam_attempt.duration * 60 * 1000;
    const job = await scheduleService.addJob(
      SCHEDULE_JOB_NAME.SUBMIT_EXAM,
      { id: exam_attempt.id },
      {
        delay: delayMs,
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
          attributes: ['id', 'title', 'duration'],
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
    return await ExamAttempts.findOne({
      where: {
        id,
        deleted_at: null, // Only find non-deleted attempts
      },
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
    // Load exam_attempt with exam for buildExamDetail
    const exam_attempt = await ExamAttempts.findOne({
      where: {
        id: exam_id,
        deleted_at: null,
        user_id,
      },
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
            'id',
            'title',
            'note',
            'list_question',
            'total_question',
            'creator_id',
            'lastest_start_time',
          ],
          required: true,
        },
      ],
    });
    
    if (!exam_attempt) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_not_found');
    }
    
    this.checkExamNotClosed(exam_attempt);

    return await this.buildExamDetail(exam_attempt, false);
  }

  async detailAfterSubmit(id: number, user_id: number) {
    // Load exam_attempt with exam for buildExamDetail
    const exam_attempt = await ExamAttempts.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
            'id',
            'title',
            'note',
            'list_question',
            'total_question',
            'creator_id',
            'lastest_start_time',
          ],
          required: true,
        },
      ],
    });
    
    if (!exam_attempt) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_not_found');
    }
    
    if (
      user_id !== exam_attempt.user_id &&
      user_id != exam_attempt.exam.creator_id
    ) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_unauthorized_access');
    }
    // User who submitted the exam can always view their result immediately
    // Only check lastest_start_time for review access (handled in frontend)

    return await this.buildExamDetail(exam_attempt, true);
  }

  async getOnGoingExam(data: ICreateExamAttempt, user_id: number) {
    const ongoingExam = await ExamAttempts.findOne({
      where: { 
        user_id, 
        exam_id: data.exam_id, 
        finished_at: null,
        deleted_at: null, // Only find non-deleted attempts
      },
      attributes: ['id'],
    });
    return ongoingExam;
  }

  // find or fail
  async findOrFail(
    exam_attempt_id: number,
    user_id?: number,
    transaction?: Transaction,
  ) {
    const exam_attempt = await ExamAttempts.findOne({
      where: {
        id: exam_attempt_id,
        deleted_at: null, // Only find non-deleted attempts
        ...(user_id ? { user_id } : {}),
      },
      transaction,
    });
    if (!exam_attempt) {
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
    await this.saveAnswer(
      data,
      exam_attempt_id,
      user_id,
      transaction,
    );

    // Reload exam_attempt with exam for gradingExam
    const exam_attempt_db = await ExamAttempts.findOne({
      where: {
        id: exam_attempt_id,
        deleted_at: null,
        user_id,
      },
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
            'id',
            'title',
            'note',
            'list_question',
            'total_question',
            'creator_id',
          ],
          required: true,
        },
      ],
      transaction,
    });

    if (!exam_attempt_db) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_not_found');
    }

    this.checkExamNotClosed(exam_attempt_db);
    exam_attempt_db.set({ finished_at });
    const exam_attempt = await this.gradingExam(exam_attempt_db, transaction);
    return {
      ...exam_attempt.dataValues,
      exam: _.pick(exam_attempt.exam, ['title', 'note', 'id', 'creator_id']),
    };
  }

  async submitBySystem(exam_attempt_id: number) {
    const finished_at = new Date();
    // Need to load exam for gradingExam
    const exam_attempt = await ExamAttempts.findOne({
      where: {
        id: exam_attempt_id,
        deleted_at: null,
      },
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
            'id',
            'title',
            'note',
            'list_question',
            'total_question',
          ],
          required: true,
        },
      ],
    });
    
    if (!exam_attempt) {
      throw new AppError(BAD_REQUEST, 'exam_attempt_not_found');
    }
    
    // Only submit if not already submitted
    if (exam_attempt.finished_at) {
      return; // Already submitted, skip
    }
    
    // Don't check exam closure for system auto-submit (time expired)
    // This is called by scheduled job when time runs out
    exam_attempt.set({ finished_at });
    await this.gradingExam(exam_attempt);
  }

  // validate
  private checkExamNotClosed(exam_attempt: ExamAttempts) {
    // If already finished, cannot save/submit
    if (exam_attempt.finished_at) {
      throw new AppError(
        BAD_REQUEST, 
        'Bài thi đã được nộp. Không thể chỉnh sửa hoặc nộp lại.',
        'exam_submission_closed'
      );
    }
  }

  // helper
  private buildQuery(filter: IFilterExamAttempt) {
    const query: any = {
      deleted_at: null, // Only get non-deleted attempts
    };
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

    // Calculate total score of the exam (sum of all question scores)
    const total_score = list_question.reduce((sum, q) => sum + (q.score || 0), 0);

    return {
      ..._.pick(exam_attempt, [
        'id',
        'exam_id',
        'user_id',
        'started_at',
        'finished_at',
        'duration',
        'total_question',
        'correct_question',
        'wrong_question',
        'score',
      ]),
      exam: _.pick(exam_attempt.exam, ['title', 'note', 'id', 'creator_id', 'lastest_start_time']),
      list_question,
      total_score, // Add total score of the exam
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
      
      // Check if there's an ongoing exam first (should be handled by controller, but double check)
      const ongoingExam = await this.getOnGoingExam(data, user_id);
      if (ongoingExam) {
        // This should not happen as controller handles it, but just in case
        throw new AppError(BAD_REQUEST, 'exam_already_started');
      }
      
      // Count all finished attempts in DB (including soft deleted ones)
      // Soft delete chỉ ẩn khỏi lịch sử, nhưng vẫn tính vào số lượt làm bài
      const count_exampt_attempt = await ExamAttempts.count({
        where: { 
          exam_id: data.exam_id, 
          user_id: user_id,
          finished_at: { [Op.ne]: null }, // Only count finished attempts
          // Don't filter deleted_at - count all attempts in DB
        },
      });
      
      if (exam.max_attempt && count_exampt_attempt >= exam.max_attempt) {
        throw new AppError(
          BAD_REQUEST, 
          `Bạn đã làm bài ${count_exampt_attempt}/${exam.max_attempt} lần. Không thể làm thêm lần nào nữa.`,
          'no_more_turns',
          {
            current_attempts: count_exampt_attempt,
            max_attempts: exam.max_attempt
          }
        );
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

  // delete (soft delete)
  async destroy(id: number, user_id: number, transaction?: Transaction) {
    const exam_attempt = await this.findOrFail(id, user_id, transaction);
    
    // Delete scheduled job if exists
    if (exam_attempt.job_schedule_id) {
      const scheduleService = ScheduleService.getInstance();
      try {
        await scheduleService.deleteJob(exam_attempt.job_schedule_id);
      } catch (error) {
        // Job might already be deleted, ignore error
        console.warn('Failed to delete scheduled job:', error);
      }
    }
    
    // Soft delete: set deleted_at instead of destroying the record
    exam_attempt.deleted_at = new Date();
    await exam_attempt.save({ transaction });
    return true;
  }
}
