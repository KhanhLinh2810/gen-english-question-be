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
    const { query: query_for_creator, is_required: required_for_creator } =
      this.buildQueryCretor(filter);
    
    // Handle combined search: if search is provided, we need to search both title and username
    // This requires a more complex query structure
    if (filter.search && filter.search.trim()) {
      const searchTerm = `%${escapeForILike(filter.search.trim())}%`;
      
      // Remove title from main query since we'll handle it in the OR condition
      const { title, ...queryWithoutTitle } = query;
      
      return await Exams.findAndCountAll({
        where: {
          ...queryWithoutTitle,
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            {
              '$creator.username$': { [Op.like]: searchTerm }
            }
          ]
        },
        include: [
          {
            model: Users,
            as: 'creator',
            attributes: ['id', 'username', 'avatar_url'],
            required: true, // Always required when searching by username
          },
        ],
        limit: paging.limit,
        offset: paging.offset,
        order: [[paging.order_by, paging.sort]],
        distinct: true,
      });
    }
    
    // Original logic for non-combined search
    return await Exams.findAndCountAll({
      where: query,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
          where: query_for_creator,
          required: required_for_creator,
        },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });
  }

  // get many with full data (including questions)
  async getManyWithQuestions(filter: IFilterExam, paging: IPagination) {
    const rawData = await this.getMany(filter, paging);
    
    // Transform each exam to include questions
    const transformedRows = await Promise.all(
      rawData.rows.map(async (exam) => {
        const list_question_id = exam.list_question.map(
          (question) => question.question_id,
        );
        
        if (list_question_id.length === 0) {
          // Return exam with empty questions if no questions
          return {
            ...exam.toJSON(),
            list_question: []
          };
        }
        
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
      })
    );

    return {
      rows: transformedRows,
      count: rawData.count
    };
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
    transaction?: Transaction,
  ) {
    const question = await this.findOrFail(id, creator_id);
    await question.update(data, { transaction });
    return question;
  }

  // validate

  // helper
  private buildQuery(filter: IFilterExam) {
    const query: any = {};
    
    // Handle combined search for title (will be handled in buildQueryCreator for username)
    // Use LIKE with % wildcards for contains search
    if (filter.search && filter.search.trim()) {
      query.title = { [Op.like]: `%${escapeForILike(filter.search.trim())}%` };
    } else if (filter.title && filter.title.trim()) {
      query.title = { [Op.like]: `%${escapeForILike(filter.title.trim())}%` };
    }
    
    // Handle duration range - only add if values are valid
    const durationFrom = _.toSafeInteger(filter.duration_from);
    const durationTo = _.toSafeInteger(filter.duration_to);
    
    if (durationFrom > 0 || durationTo > 0) {
      const durationQuery: any = {};
      if (durationFrom > 0) {
        durationQuery[Op.gte] = durationFrom;
      }
      if (durationTo > 0) {
        durationQuery[Op.lte] = durationTo;
      }
      query.duration = durationQuery;
    } else if (filter.duration && _.toSafeInteger(filter.duration) > 0) {
      query.duration = _.toSafeInteger(filter.duration);
    }
    
    // Handle earliest_start_time - simple comparison
    if (parseSafeDate(filter.earliest_start_time)) {
      query.earliest_start_time = {
        [Op.gte]: parseSafeDate(filter.earliest_start_time),
      };
    }
    
    // Handle lastest_start_time - simple comparison
    if (parseSafeDate(filter.lastest_start_time)) {
      query.lastest_start_time = {
        [Op.lte]: parseSafeDate(filter.lastest_start_time),
      };
    }
    
    if (filter.user_id && _.toSafeInteger(filter.user_id) > 0) {
      query.creator_id = _.toSafeInteger(filter.user_id);
    }
    return query;
  }

  private buildQueryCretor(filter: IFilterExam) {
    const query: any = {};
    let is_required = false;

    if (filter.user_id && _.toSafeInteger(filter.user_id) > 0) {
      is_required = true;
    }
    
    // Handle combined search for username - use LIKE with % wildcards for contains search
    if (filter.search && filter.search.trim()) {
      query.username = { [Op.like]: `%${escapeForILike(filter.search.trim())}%` };
      is_required = true;
    } else if (filter.username && filter.username.trim()) {
      query.username = { [Op.like]: `%${escapeForILike(filter.username.trim())}%` };
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
