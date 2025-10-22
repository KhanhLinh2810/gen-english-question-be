import {
  CreationAttributes,
  Op,
  Transaction,
  WhereAttributeHash,
} from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { IFilterUser, IPagination } from '../interfaces';
import { Users } from '../models';
import { AppError } from '../utility/appError.util';
import { escapeSearchKeyword } from '../utility/utils';
import _ from 'lodash';

export class UserService {
  private static instance: UserService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Users>, transaction?: Transaction) {
    const user = await Users.create(data, { transaction });
    return user;
  }

  // get many
  async getMany(filter: IFilterUser, paging: IPagination) {
    return await Users.findAndCountAll({
      where: this.buildQuery(filter),
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });
  }

  // get one
  async getOne(filter: IFilterUser): Promise<Users | null> {
    return await Users.findOne({
      where: this.buildQuery(filter),
    });
  }

  async findByPk(userId: number, transaction?: Transaction) {
    const user = await Users.findByPk(userId, { transaction });
    return user;
  }

  async findOrFail(userId: number, transaction?: Transaction) {
    const user = await Users.findByPk(userId, { transaction });
    if (!user) {
      throw new AppError(BAD_REQUEST, 'user_not_found');
    }
    return user;
  }

  // destroy
  async destroy(condition: WhereAttributeHash) {
    return await Users.destroy({ where: condition });
  }

  // validate
  async validateUsernameAndEmail(
    username: string,
    email: string,
    excludeUserId?: number,
  ) {
    const query = excludeUserId
      ? {
          [Op.or]: [{ username }, { email }],
        }
      : {
          [Op.or]: [{ username }, { email }],
          id: { [Op.ne]: excludeUserId },
        };
    const emailExists = await Users.findOne({
      where: query,
    });
    if (emailExists) {
      throw new AppError(BAD_REQUEST, 'email_already_exists');
    }
  }

  // helpers
  private buildQuery(filter: IFilterUser) {
    const query: any = {};
    if (filter.username) {
      query.username = {
        [Op.iLike]: `%${escapeSearchKeyword(filter.username)}%`,
      };
    }
    if (filter.email) {
      query.email = {
        [Op.iLike]: `%${escapeSearchKeyword(filter.email)}%`,
      };
    }

    return query;
  }
}
