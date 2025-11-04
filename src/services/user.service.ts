import _ from 'lodash';
import {
  CreationAttributes,
  Op,
  Transaction,
  WhereAttributeHash,
} from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import {
  IFilterUser,
  IPagination,
  IUpdatePasswordUser,
  IUpdateUser,
} from '../interfaces';
import { Users } from '../models';
import { AppError } from '../utility/appError.util';
import { EncUtil } from '../utility/encryption';
import { escapeSearchKeyword } from '../utility/utils';

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

  // update
  async updateUsernameAndEmail(
    data: IUpdateUser,
    userId: number,
    transaction?: Transaction,
  ) {
    await this.validateUsernameAndEmail(data.username, data.email, userId);
    const user = await this.findOrFail(userId);
    user.set(data);
    await user.save({ transaction });
    return user;
  }

  async updatePassword(
    data: IUpdatePasswordUser,
    userId: number,
    transaction?: Transaction,
  ) {
    const user = await Users.findByPk(userId, {
      attributes: ['id', 'password'],
    });
    if (!user) {
      throw new AppError(BAD_REQUEST, 'user_not_found');
    }

    const isMatch = await EncUtil.comparePassword(
      data.old_password,
      user.password,
    );
    if (!isMatch) {
      throw new AppError(BAD_REQUEST, 'password_mismatch');
    }

    user.set({ password: await EncUtil.createHash(data.new_password) });
    await user.save({ transaction });
    return user;
  }

  // destroy
  async destroy(id: number) {
    return await Users.destroy({ where: { id: id } });
  }

  // validate
  async validateUsernameAndEmail(
    username: string,
    email: string,
    excludeUserId?: number,
  ) {
    console.log(excludeUserId);
    const query = excludeUserId
      ? {
          [Op.or]: [{ username }, { email }],
          id: { [Op.ne]: excludeUserId },
        }
      : {
          [Op.or]: [{ username }, { email }],
        };
    const exist_user = await Users.findOne({
      where: query,
    });
    if (exist_user) {
      throw new AppError(BAD_REQUEST, 'username_or_email_already_exists');
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
