import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import {
  ICreateRating,
  IFilterRating,
  IUpdateRating,
  IPagination,
} from '../interfaces';
import { Ratings } from '../models/ratings.model';
import { Users } from '../models/users.model';
import { AppError } from '../utility/appError.util';

export class RatingService {
  private static instance: RatingService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Ratings>, transaction?: Transaction) {
    // Avoid duplicate composite primary key (question_id, user_id).
    // If a rating by the same user for the same question exists, update it instead of inserting.
    const existing = await Ratings.findOne({
      where: {
        user_id: (data as any).user_id,
        question_id: (data as any).question_id,
      },
      transaction,
    });
    if (existing) {
      await existing.update(data, { transaction });
      return existing;
    }
    return await Ratings.create(data, { transaction });
  }

  // get many
  async getMany(filter: IFilterRating, paging: IPagination) {
    const where = this.buildQuery(filter);
    return await Ratings.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url'],
        },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
    });
  }

  // find one by composite key
  async findByCompositeKey(
    user_id: number,
    question_id: number,
    transaction?: Transaction,
  ) {
    return await Ratings.findOne({
      where: { user_id, question_id },
      transaction,
    });
  }

  // find or fail
  async findOrFail(
    user_id: number,
    question_id: number,
    transaction?: Transaction,
  ) {
    const rating = await this.findByCompositeKey(
      user_id,
      question_id,
      transaction,
    );
    if (!rating) {
      throw new AppError(BAD_REQUEST, 'rating_not_found');
    }
    return rating;
  }

  // update
  async update(
    data: CreationAttributes<Ratings>,
    user_id: number,
    question_id: number,
    transaction?: Transaction,
  ) {
    const rating = await this.findOrFail(user_id, question_id, transaction);
    await rating.update(data, { transaction });
    return rating;
  }

  // destroy
  async destroy(
    user_id: number,
    question_id: number,
    transaction?: Transaction,
  ) {
    const rating = await this.findOrFail(user_id, question_id, transaction);
    await rating.destroy({ transaction });
    return rating;
  }

  // helper
  private buildQuery(filter: IFilterRating) {
    const query: any = {};
    if (filter.rating_value) {
      query.rating_value = { [Op.iLike]: `%${filter.rating_value}%` };
    }
    if (filter.user_id) {
      query.user_id = filter.user_id;
    }
    if (filter.question_id) {
      query.question_id = filter.question_id;
    }
    return query;
  }
}
