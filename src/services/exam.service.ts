import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { ExamDTO } from '../dtos';
import { ICreateExam, IFilterExam, IPagination } from '../interfaces';
import { Choices, Exams, Questions, Users } from '../models';
import { AppError } from '../utility/appError.util';
import { escapeForILike, parseSafeDate } from '../utility/utils';

export class ExamService {
  private static instance: ExamService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Exams>, transaction?: Transaction) {
    return await Exams.create(data, { transaction });
  }

  // get many
  async getMany(filter: IFilterExam, paging: IPagination) {
    const query = this.buildQuery(filter);
    const { query: queryForCreator, is_required: requiredForCreator } =
      this.buildQueryCretor(filter);
    return await Exams.findAndCountAll({
      where: query,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
          where: queryForCreator,
          required: requiredForCreator,
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
    return await Exams.findByPk(id, {
      attributes: { exclude: ['list_question'] },
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
      ],
      transaction,
    });
  }

  // find or fail
  async findOrFail(id: number, creator_id?: number, transaction?: Transaction) {
    const exam = await this.findByPk(id, transaction);
    if (!exam || (creator_id && exam.creator_id !== creator_id)) {
      throw new AppError(BAD_REQUEST, 'exam_not_found');
    }
    return exam;
  }

  async findOrFailWithRelations(
    id: number,
    creator_id?: number,
    transaction?: Transaction,
  ) {
    const exam = await Exams.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
      ],
      transaction,
    });
    if (!exam || (creator_id && exam.creator_id !== creator_id)) {
      throw new AppError(BAD_REQUEST, 'exam_not_found');
    }
    const list_question_id = exam.list_question.map(
      (question) => question.question_id,
    );
    const list_question = await Questions.findAll({
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

    return new ExamDTO(exam, list_question);
  }

  // update
  async update(
    id: number,
    data: CreationAttributes<Exams>,
    creator_id: number,
    transaction: Transaction,
  ) {
    const question = await this.findOrFail(id, creator_id);
    await question.update(data, { transaction });
    return question;
  }

  // validate

  // helper
  private buildQuery(filter: IFilterExam) {
    const query: any = {};
    if (filter.title) {
      query.title = { [Op.like]: escapeForILike(filter.title) };
    }
    if (filter.duration) {
      query.duration = _.toSafeInteger(filter.duration);
    }
    if (parseSafeDate(filter.earliest_start_time)) {
      query.earliest_start_time = {
        [Op.gte]: parseSafeDate(filter.earliest_start_time),
      };
    }
    if (parseSafeDate(filter.lastest_start_time)) {
      query.lastest_start_time = {
        [Op.lte]: parseSafeDate(filter.lastest_start_time),
      };
    }
    if (filter.user_id) {
      query.creator_id = _.toSafeInteger(filter.user_id);
    }
    return query;
  }

  private buildQueryCretor(filter: IFilterExam) {
    const query: any = {};
    let is_required = false;

    if (_.toSafeInteger(filter.user_id)) {
      is_required = true;
    }
    if (filter.username) {
      query.username = { [Op.like]: escapeForILike(filter.username) };
      is_required = true;
    }
    return { query, is_required };
  }

  // other
  async processCreateData(data: ICreateExam, creator_id: number) {
    const earliest_start_time = new Date(data.earliest_start_time);
    const lastest_start_time = parseSafeDate(data.lastest_start_time);
    if (
      lastest_start_time &&
      earliest_start_time.getTime() > lastest_start_time.getTime()
    )
      throw new AppError(
        BAD_REQUEST,
        'lastest_start_time_must_be_later_than_earliest_start_time',
      );

    const list_question = data.list_question.sort(
      (a, b) => a.question_id - b.question_id,
    );
    const list_question_id = list_question.map(
      (question) => question.question_id,
    );
    const total_question = await Questions.count({
      where: {
        [Op.and]: [
          { id: { [Op.in]: list_question_id } },
          {
            [Op.or]: [{ creator_id }, { creator_id: null }],
          },
        ],
      },
    });

    if (total_question !== list_question_id.length) {
      throw new AppError(BAD_REQUEST, 'exist_invalid_question_id');
    }

    return {
      ...data,
      creator_id,
      list_question,
      total_question,
    };
  }
}
