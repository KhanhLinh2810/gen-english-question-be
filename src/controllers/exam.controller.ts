import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { CustomRequest, IFilterExam } from '../interfaces';
import { ExamService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate, parseSafeDate } from '../utility/utils';

export class ExamController {
  private readonly examService: ExamService;

  constructor() {
    this.examService = ExamService.getInstance();
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterExam = req.query;
      if (filter.is_current_user_only) {
        filter.user_id = user.id;
      }
      const data = await this.examService.getMany(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(data.rows, 'success', data.count, limit, page));
    } catch (e) {
      next(e);
    }
  }

  async detailPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = _.toSafeInteger(req.params.id);
      const exam = await this.examService.findOrFail(examId);
      return res.status(RESPONSE_SUCCESS).json(resOK(exam));
    } catch (e) {
      next(e);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const examId = _.toSafeInteger(req.params.id);
      const exam = await this.examService.findOrFailWithRelations(examId);
      return res.status(RESPONSE_SUCCESS).json(resOK(exam));
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
      const processCreateData = await this.examService.processCreateData(
        req.body,
        user.id,
      );
      await this.examService.create({
        ...processCreateData,
        earliest_start_time: new Date(processCreateData.earliest_start_time),
        lastest_start_time: parseSafeDate(processCreateData.lastest_start_time),
      });
      return res.status(RESPONSE_SUCCESS).json(resOK());
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

      const processCreateData = await this.examService.processCreateData(
        req.body,
        user.id,
      );

      const exam = await this.examService.update(
        _.toSafeInteger(req.params.id),
        {
          ...processCreateData,
          earliest_start_time: new Date(processCreateData.earliest_start_time),
          lastest_start_time: parseSafeDate(
            processCreateData.lastest_start_time,
          ),
        },
        user.id,
      );
      return res.status(RESPONSE_SUCCESS).json(resOK(exam));
    } catch (e) {
      next(e);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const exam = await this.examService.findOrFail(
        _.toSafeInteger(req.params.id),
        user.id,
      );
      await exam.destroy();
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }
}

export const examController = new ExamController();
