import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import {
  ICreateComment,
  IFilterComment,
  IUpdateComment,
  IPagination,
} from '../interfaces';
import { Comments } from '../models/comments.model';
import { Users } from '../models/users.model';
import { AppError } from '../utility/appError.util';
import { Choices } from '../models/choices.model';
import { Questions } from '../models/questions.model';

export class CommentService {
  private static instance: CommentService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Comments>, transaction?: Transaction) {
    return await Comments.create(data, {
      transaction,
    });
  }

  // get many
  async getMany(filter: IFilterComment, paging: IPagination) {
    const where = this.buildQuery(filter);
    return await Comments.findAndCountAll({
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

  // get one
  async findByPk(id: number, transaction?: Transaction) {
    return await Comments.findByPk(id, { transaction });
  }

  // find or fail
  async findOrFail(id: number, user_id?: number, transaction?: Transaction) {
    const comment = await Comments.findByPk(id, { transaction });
    if (!comment || (user_id && comment.user_id !== user_id)) {
      throw new AppError(BAD_REQUEST, 'comment_not_found');
    }
    return comment;
  }

  // find or fail with relations
  async findOrFailWithRelations(
    id: number,
    user_id?: number,
    transaction?: Transaction,
  ) {
    const comment = await Comments.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url'],
        },
      ],
      transaction,
    });
    if (!comment || (user_id && comment.user_id !== user_id)) {
      throw new AppError(BAD_REQUEST, 'comment_not_found');
    }
    return comment;
  }

  // update
  async update(
    id: number,
    data: CreationAttributes<Comments>,
    user_id: number,
    transaction: Transaction,
  ) {
    const comment = await this.findOrFail(id, user_id, transaction);
    await comment.update(data, { transaction });

    return comment;
  }

  // destroy
  async destroy(id: number) {
    return await Comments.destroy({ where: { id: id } });
  }

  // helper
  private buildQuery(filter: IFilterComment) {
    const query: any = {};
    if (filter.content) {
      query.content = { [Op.iLike]: `%${filter.content}%` };
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
