import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { RESPONSE_SUCCESS } from '../constants/constants';
import { ListUserDTO, UserDTO } from '../dtos';
import { CustomRequest, IFilterUser } from '../interfaces';
import { UserService } from '../services';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';

export class UserController {
  private readonly userService: UserService;
  constructor() {
    this.userService = UserService.getInstance();
  }

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as CustomRequest).user;
      return res.status(RESPONSE_SUCCESS).json(resOK(user));
    } catch (error) {
      next(error);
    }
  };

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      let filter: IFilterUser = req.query;

      const data = await this.userService.getMany(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });
      const listUser = new ListUserDTO(data.rows);
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(listUser.data, 'success', data.count, limit, page));
    } catch (e) {
      next(e);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = _.toSafeInteger(req.params.id);
      const user = await this.userService.findOrFail(userId);
      return res.status(RESPONSE_SUCCESS).json(resOK(new UserDTO(user)));
    } catch (e) {
      next(e);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = _.toSafeInteger(req.params.id);
      const user = await this.userService.findOrFail(userId);
      await user.destroy();
      res.status(RESPONSE_SUCCESS).json(resOK(null));
    } catch (e) {
      next(e);
    }
  }
}

export const userController = new UserController();
