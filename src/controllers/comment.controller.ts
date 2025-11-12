import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { ListCommentDTO, CommentDTO } from '../dtos';
import { CustomRequest, IFilterComment } from '../interfaces';
import { db } from '../loaders/database.loader';
import { CommentService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';

export class CommentController {
  private readonly commentService: CommentService;

  constructor() {
    this.commentService = CommentService.getInstance();
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterComment = req.query;
      const data = await this.commentService.getMany(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(data, 'success', data.count, limit, page));
    } catch (e) {
      next(e);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await this.commentService.findByPk(
        _.toSafeInteger(req.params.id),
      );
      if (!comment) {
        throw new AppError(BAD_REQUEST, 'comment_not_found');
      }

      return res.status(RESPONSE_SUCCESS).json(resOK(new CommentDTO(comment)));
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const data = req.body;

      const comment = await this.commentService.create({
        ...data,
        user_id: user.id,
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new CommentDTO(comment, user)));
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequalize.transaction();
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const comment = await this.commentService.update(
        _.toSafeInteger(req.params.id),
        req.body,
        user.id,
        transaction,
      );
      await transaction.commit();
      return res.status(RESPONSE_SUCCESS).json(resOK(new CommentDTO(comment)));
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as CustomRequest).user;
    if (!user) {
      throw new AppError(BAD_REQUEST, 'user_not_found');
    }

    const comment = await this.commentService.findOrFailWithRelations(
      _.toSafeInteger(req.params.id),
      user.id,
    );

    await comment.destroy();
    return res.status(RESPONSE_SUCCESS).json(resOK());
  } catch (e) {
    next(e);
  }
}

}

export const commentController = new CommentController();
