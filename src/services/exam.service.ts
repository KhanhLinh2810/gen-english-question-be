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
      
      // Remove title and Op.or from main query since we'll handle it in the OR condition
      const { title, [Op.or]: existingOr, ...queryWithoutTitle } = query;
      
      // Build the OR condition for search
      const searchOrConditions = [
        { title: { [Op.like]: searchTerm } },
        {
          '$creator.username$': { [Op.like]: searchTerm }
        }
      ];
      
      // If we have existing OR conditions (for is_public/creator_id), combine them
      if (existingOr && Array.isArray(existingOr)) {
        // Combine search OR with existing OR using Op.and
        return await Exams.findAndCountAll({
          where: {
            ...queryWithoutTitle,
            [Op.and]: [
              {
                [Op.or]: searchOrConditions
              },
              {
                [Op.or]: existingOr
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
      } else {
        return await Exams.findAndCountAll({
          where: {
            ...queryWithoutTitle,
            [Op.or]: searchOrConditions
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
    if (!exam) {
      throw new AppError(BAD_REQUEST, 'exam_not_found');
    }
    // Only creator can access (if creator_id is provided and exam has a creator)
    // If exam has no creator, no one can edit/delete it
    if (creator_id) {
      if (!exam.creator_id || exam.creator_id !== creator_id) {
        throw new AppError(BAD_REQUEST, 'exam_not_found');
      }
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
    
    // Handle user_id and is_public filter logic
    if (filter.user_id && _.toSafeInteger(filter.user_id) > 0) {
      // If filtering by specific user (is_current_user_only), show all their exams
      query.creator_id = _.toSafeInteger(filter.user_id);
      // Don't filter by is_public when showing own exams
    } else if (filter.is_public !== undefined) {
      // If is_public is explicitly set, filter by it
      query.is_public = filter.is_public;
    } else if (filter.is_current_user_only !== 'true' && !filter.is_current_user_only) {
      // When not filtering by own exams, show public exams OR user's own exams
      if ((filter as any).current_user_id) {
        // Show public exams OR user's own exams
        const publicOrOwnCondition = {
          [Op.or]: [
            { is_public: true },
            { creator_id: (filter as any).current_user_id }
          ]
        };
        
        // Check if there are other conditions by checking query keys
        const queryKeys = Object.keys(query);
        const hasOtherConditions = queryKeys.length > 0;
        
        if (hasOtherConditions) {
          // Collect all existing conditions
          const existingConditions: any[] = [];
          
          // Add existing Op.and conditions if any
          if (query[Op.and]) {
            existingConditions.push(...(query[Op.and] as any[]));
          }
          
          // Add other individual conditions (regular keys, not symbols)
          queryKeys.forEach(key => {
            const value = query[key];
            // Only add if it's not already in Op.and and not a symbol
            if (value !== undefined && key !== String(Op.or) && key !== String(Op.and)) {
              existingConditions.push({ [key]: value });
            }
          });
          
          // Add the public or own condition
          existingConditions.push(publicOrOwnCondition);
          
          // Clear query and rebuild with Op.and
          Object.keys(query).forEach(key => {
            if (key !== String(Op.or) && key !== String(Op.and)) {
              delete query[key];
            }
          });
          if (Op.or in query) delete query[Op.or];
          if (Op.and in query) delete query[Op.and];
          
          query[Op.and] = existingConditions;
        } else {
          // No other conditions, just use Op.or
          query[Op.or] = [
            { is_public: true },
            { creator_id: (filter as any).current_user_id }
          ];
        }
      } else {
        // No user context, only show public exams
        query.is_public = true;
      }
    }
    // If is_current_user_only is 'true' or truthy, don't filter by is_public (show all user's exams)
    
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
      duration: data.duration || 30, // Default 30 minutes
      is_public: data.is_public !== undefined ? data.is_public : true, // Default true (public)
    };
  }
}
