import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { ListUserDTO, UserDTO } from '../dtos';
import { CustomRequest, IFilterUser } from '../interfaces';
import { UserService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate, resolveUploadURL } from '../utility/utils';

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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const result = await this.userService.updateUsernameAndEmail(
        req.body,
        user.id,
      );
      return res.status(RESPONSE_SUCCESS).json(resOK(new UserDTO(result)));
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      await this.userService.updatePassword(req.body, user.id);
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const userDb = await this.userService.findOrFail(user.id);

      const file = req.file as Express.Multer.File;
      const avatar_url = resolveUploadURL(file.path);
      userDb.set({ avatar_url });
      await userDb.save();

      return res.status(RESPONSE_SUCCESS).json(resOK({ ...user, avatar_url }));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      await this.userService.destroy(user.id);
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }
}

export const userController = new UserController();
