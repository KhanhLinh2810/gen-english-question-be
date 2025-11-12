import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { ListRatingDTO, RatingDTO } from '../dtos';
import { CustomRequest, IFilterRating } from '../interfaces';
import { db } from '../loaders/database.loader';
import { RatingService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';

export class RatingController {
  private readonly ratingService: RatingService;

  constructor() {
    this.ratingService = RatingService.getInstance();
  }

  // GET /ratings
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterRating = req.query;
      const data = await this.ratingService.getMany(filter, {
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

  // GET /ratings/:user_id/:question_id
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = _.toSafeInteger(req.params.user_id);
      const question_id = _.toSafeInteger(req.params.question_id);

      const rating = await this.ratingService.findOrFail(user_id, question_id);

      return res.status(RESPONSE_SUCCESS).json(resOK(new RatingDTO(rating)));
    } catch (e) {
      next(e);
    }
  }

  // POST /ratings
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const data = req.body;
      const rating = await this.ratingService.create({
        ...data,
        user_id: user.id, // composite key part
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new RatingDTO(rating, user)));
    } catch (e) {
      next(e);
    }
  }

  // PUT /ratings/:user_id/:question_id
  async update(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequalize.transaction();
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const user_id = _.toSafeInteger(req.params.user_id);
      const question_id = _.toSafeInteger(req.params.question_id);

      const rating = await this.ratingService.update(
        req.body,
        user_id,
        question_id,
        transaction,
      );

      await transaction.commit();
      return res.status(RESPONSE_SUCCESS).json(resOK(new RatingDTO(rating)));
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }

  // DELETE /ratings/:question_id
  async destroy(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequalize.transaction();
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const question_id = _.toSafeInteger(req.params.question_id);

      await this.ratingService.destroy(user.id, question_id, transaction);
      await transaction.commit();

      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }
}

export const ratingController = new RatingController();
