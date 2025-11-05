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
import { duration } from 'moment';
import { title } from 'process';

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
