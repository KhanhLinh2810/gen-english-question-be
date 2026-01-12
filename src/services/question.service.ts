import _ from 'lodash';
import { CreationAttributes, Op, Transaction, fn, col } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { ICreateQuestion, IFilterQuestion, IPagination } from '../interfaces';
import { Choices } from '../models/choices.model';
import { Questions } from '../models/questions.model';
import { Users } from '../models/users.model';
import { Comments } from '../models/comments.model';
import { Ratings } from '../models/ratings.model';
import { AppError } from '../utility/appError.util';

export class QuestionService {
  private static instance: QuestionService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Questions>, transaction?: Transaction) {
    return await Questions.create(data, {
      include: [{ model: Choices, as: 'choices' }],
      transaction,
    });
  }

  async createMany(
    data: CreationAttributes<Questions>[],
    transaction?: Transaction,
  ) {
    return await Questions.bulkCreate(data, {
      include: [{ model: Choices, as: 'choices' }],
      transaction,
    });
  }

  // get many
  async getMany(filter: IFilterQuestion, paging: IPagination) {
    const where = this.buildQuery(filter);
    return await Questions.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
        {
          model: Choices,
          as: 'choices',
          attributes: ['id', 'content', 'is_correct', 'explanation'],
        },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });
  }

  // get many with comment count and average rating attached
  async getManyWithStats(filter: IFilterQuestion, paging: IPagination) {
    const where = this.buildQuery(filter);
    const result = await Questions.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
        {
          model: Choices,
          as: 'choices',
          attributes: ['id', 'content', 'is_correct', 'explanation'],
        },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });

    const ids = result.rows.map((r) => r.id);
    if (ids.length === 0) return result;

    // batch query comment counts
    const commentRows: any[] = await Comments.findAll({
      where: { question_id: { [Op.in]: ids } },
      attributes: ['question_id', [fn('COUNT', col('id')), 'count']],
      group: ['question_id'],
      raw: true,
    });

    const ratingRows: any[] = await Ratings.findAll({
      where: { question_id: { [Op.in]: ids } },
      attributes: [
        'question_id',
        [fn('AVG', col('rating_value')), 'avg_rating'],
      ],
      group: ['question_id'],
      raw: true,
    });

    const commentMap = new Map<number, number>();
    for (const r of commentRows) commentMap.set(r.question_id, Number(r.count));
    const ratingMap = new Map<number, number>();
    for (const r of ratingRows)
      ratingMap.set(r.question_id, Number(Number(r.avg_rating).toFixed(2)));

    for (const q of result.rows) {
      if (!q.dataValues) q.dataValues = {} as any;
      (q.dataValues as any).comment_count = commentMap.get(q.id) ?? 0;
      (q.dataValues as any).average_rating = ratingMap.get(q.id) ?? null;
    }

    return result;
  }

  // get one
  async findByPk(id: number, transaction?: Transaction) {
    return await Questions.findByPk(id, { transaction });
  }

  // find or fail
  async findOrFailWithRelations(
    id: number,
    creator_id?: number,
    transaction?: Transaction,
  ) {
    const question = await Questions.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
        {
          model: Choices,
          as: 'choices',
          attributes: ['id', 'content', 'is_correct', 'explanation'],
        },
      ],
      transaction,
    });
    if (!question) {
      throw new AppError(BAD_REQUEST, 'question_not_found');
    }
    // Only creator can access (if creator_id is provided and question has a creator)
    // If question has no creator (system question), no one can edit/delete it
    if (creator_id) {
      if (!question.creator_id || question.creator_id !== creator_id) {
        throw new AppError(BAD_REQUEST, 'question_not_found');
      }
    }

    // attach comment count and average rating for this question
    try {
      const commentRow: any = await Comments.findOne({
        where: { question_id: id },
        attributes: [[fn('COUNT', col('id')), 'count']],
        raw: true,
      });
      const ratingRow: any = await Ratings.findOne({
        where: { question_id: id },
        attributes: [[fn('AVG', col('rating_value')), 'avg_rating']],
        raw: true,
      });
      if (!question.dataValues) question.dataValues = {} as any;
      (question.dataValues as any).comment_count = commentRow
        ? Number(commentRow.count)
        : 0;
      (question.dataValues as any).average_rating =
        ratingRow && ratingRow.avg_rating !== null
          ? Number(Number(ratingRow.avg_rating).toFixed(2))
          : null;
    } catch (err) {
      // ignore stats errors
    }
    return question;
  }

  // update
  async update(
    id: number,
    data: CreationAttributes<Questions>,
    creator_id: number,
    transaction: Transaction,
  ) {
    this.validateUpdateParams(data);
    const question = await this.findOrFailWithRelations(id, creator_id);
    await question.update(data, { transaction });

    const choices = await this.updateChoice(
      id,
      question.choices,
      data.choices,
      transaction,
    );
    question.choices = choices;

    return question;
  }

  private async updateChoice(
    questionId: number,
    listChoiceDb: Choices[],
    listChoiceNew: CreationAttributes<Choices>[],
    transaction: Transaction,
  ) {
    const result: Choices[] = [];

    const listCreateChoiceData: CreationAttributes<Choices>[] = [];
    const listDeleteChoiceId: number[] = [];
    const listUpdateChoiceData = new Map();

    // in list new data, choice have id will be updated, choice have not id will be created
    for (const choiceNew of listChoiceNew) {
      if (choiceNew.id) {
        listUpdateChoiceData.set(choiceNew.id, _.omit(choiceNew, ['id']));
      } else {
        listCreateChoiceData.push({
          ...choiceNew,
          questionId,
        });
      }
    }

    // in list db data, choice have id in list updated data will be updated, choice have not id in list updated data will be deleted
    for (const choiceDb of listChoiceDb) {
      const updateData = listUpdateChoiceData.get(choiceDb.id);
      if (!updateData) {
        listDeleteChoiceId.push(choiceDb.id);
        continue;
      }

      choiceDb.set(updateData);
      await choiceDb.save({ transaction });

      result.push(choiceDb);
    }

    if (listDeleteChoiceId.length > 0) {
      await Choices.destroy({
        where: { id: { [Op.in]: listDeleteChoiceId } },
        transaction,
      });
    }

    if (listCreateChoiceData) {
      const newChoices = await Choices.bulkCreate(listCreateChoiceData, {
        transaction,
      });
      result.push(...newChoices);
    }
    return result;
  }

  // destroy
  async destroy(id: number) {
    return await Questions.destroy({ where: { id: id } });
  }

  // validate
  validateParams(data: ICreateQuestion) {
    let count_correct_choice = 0;
    data.choices.map((choice) => {
      if (choice.is_correct == true) count_correct_choice++;
    });
    if (!count_correct_choice)
      throw new AppError(
        BAD_REQUEST,
        'question_must_have_at_least_one_correct_answer',
      );
  }

  validateUpdateParams(data: CreationAttributes<Questions>) {
    let count_correct_choice = 0;
    data.choices.map((choice) => {
      if (choice.is_correct == true) count_correct_choice++;
    });
    if (!count_correct_choice)
      throw new AppError(
        BAD_REQUEST,
        'question_must_have_at_least_one_correct_answer',
      );
  }

  // helper
  private buildQuery(filter: IFilterQuestion) {
    const query: any = {};

    // Simple approach: if both content and tag exist and are the same, search both
    if (filter.content && filter.tag && filter.content === filter.tag) {
      query[Op.or] = [
        { content: { [Op.like]: `%${filter.content}%` } },
        {
          tags: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.like]: `%${filter.tag}%` }],
          },
        },
      ];
    } else {
      // Individual filters
      if (filter.content) {
        query.content = { [Op.like]: `%${filter.content}%` };
      }
      if (filter.tag && !filter.content) {
        // Only apply tag filter if no content filter
        query.tags = {
          [Op.and]: [{ [Op.ne]: null }, { [Op.like]: `%${filter.tag}%` }],
        };
      }
    }

    if (filter.user_id) {
      query.creator_id = filter.user_id;
    }

    // Debug log
    console.log('buildQuery filter:', filter);
    console.log('buildQuery result:', JSON.stringify(query, null, 2));

    return query;
  }

  // other
  processCreateListQuestionData(
    questions: ICreateQuestion[],
    creator_id?: number | null,
  ) {
    return questions.map((question) => {
      this.validateParams(question);
      return {
        ...question,
        creator_id: creator_id || null, // Allow null for system questions
      };
    });
  }
}
