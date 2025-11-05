import _ from 'lodash';
import {
  IAnswerInExamAttempt,
  ICreateExamAttempt,
  ISaveAnswerExamAttempt,
} from '../interfaces';
import { AppError } from '../utility/appError.util';
import { BAD_REQUEST } from '../constants/constants';
import { Choices, ExamAttempts, Exams, Questions } from '../models';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { areArraysEqual } from '../utility/utils';

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
    return await ExamAttempts.create(data, { transaction });
  }

  // get one
  async findByPk(id: number, transaction?: Transaction) {
    return await ExamAttempts.findByPk(id, {
      include: [
        {
          model: Exams,
          as: 'exam',
          attributes: [
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
    const now = new Date();
    const lastest_finished_at = new Date(exam_attempt.started_at);
    lastest_finished_at.setMinutes(
      lastest_finished_at.getMinutes() + exam_attempt.duration,
    );

    if (
      exam_attempt.finished_at ||
      now.getTime() > lastest_finished_at.getTime()
    ) {
      throw new AppError(BAD_REQUEST, 'exam_submission_closed');
    }
    const map_question_to_choice = new Map();
    data.list_answer.map((answer) =>
      map_question_to_choice.set(answer.question_id, answer.choice_id),
    );
    const list_answer_db = exam_attempt.list_answer.map((answer_db) => {
      answer_db.choice_id = map_question_to_choice.get(answer_db.question_id);
      return answer_db;
    });
    exam_attempt.set({ list_answer: list_answer_db });
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
    const exam_attempt = await this.saveAnswer(
      data,
      exam_attempt_id,
      user_id,
      transaction,
    );

    const map_question_to_choice = new Map();
    exam_attempt.list_answer.map((answer) => {
      const question_id = answer.question_id;

      if (map_question_to_choice.has(question_id)) {
        const value = [
          ...map_question_to_choice.get(question_id),
          answer.choice_id,
        ];
        map_question_to_choice.set(question_id, value);
      } else {
        map_question_to_choice.set(question_id, [answer.choice_id]);
      }
    });
    // get question db
    const map_question_to_score = new Map();
    const list_question_id = exam_attempt.exam.list_question.map((question) => {
      map_question_to_score.set(question.question_id, question.score);
      return question.question_id;
    });
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
      const list_selected_choice_id = map_question_to_choice.get(question.id);
      if (list_selected_choice_id.length === 0 || list_correct_choice_id)
        continue;
      if (areArraysEqual(list_correct_choice_id, list_selected_choice_id)) {
        correct_question++;
        score += map_question_to_score.get(question.id);
      } else {
        wrong_question++;
      }
    }

    exam_attempt.set({
      total_question: list_question.length,
      finished_at,
      correct_question,
      wrong_question,
      score,
    });
    await exam_attempt.save({ transaction });
    return {
      ...exam_attempt.dataValues,
      exam: _.pick(exam_attempt.exam, ['title', 'note', 'id']),
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
}
