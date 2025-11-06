import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { CustomRequest, IFilterExamAttempt } from '../interfaces';
import { db } from '../loaders/database.loader';
import { ExamAttemptService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';
import { ScheduleService } from '../modules';

export class ExamAttemptController {
  private readonly examAttemptService: ExamAttemptService;

  constructor() {
    this.examAttemptService = ExamAttemptService.getInstance();
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterExamAttempt = req.query;
      const data = await this.examAttemptService.getMany(filter, {
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

  // on going exam
  async detailExam(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const exam_attempt_id = _.toSafeInteger(req.params.id);
      const data = await this.examAttemptService.detailExam(
        exam_attempt_id,
        user.id,
      );
      return res.status(RESPONSE_SUCCESS).json(resOK(data));
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

      const exist_on_going_exam = await this.examAttemptService.getOnGoingExam(
        req.body,
        user.id,
      );

      if (exist_on_going_exam) {
        const exam_attempt = await this.examAttemptService.detailExam(
          exist_on_going_exam.id,
          user.id,
        );
        return res.status(RESPONSE_SUCCESS).json(resOK(exam_attempt));
      }

      await db.sequalize.transaction(async (transaction) => {
        const { processedData, list_question, exam } =
          await this.examAttemptService.processCreateData(req.body, user.id);
        const exam_attempt = await this.examAttemptService.create(
          processedData,
          transaction,
        );
        res
          .status(RESPONSE_SUCCESS)
          .json(resOK({ ...exam_attempt.dataValues, list_question, exam }));
      });
    } catch (e) {
      next(e);
    }
  }

  async saveAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      await this.examAttemptService.saveAnswer(
        req.body,
        _.toSafeInteger(req.params.id),
        user.id,
      );
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    const transaction = await db.sequalize.transaction();
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const { job_schedule_id, ...exam_attempt } =
        await this.examAttemptService.submit(
          req.body,
          _.toSafeInteger(req.params.id),
          user.id,
          transaction,
        );
      await transaction.commit();

      const schedule_service = ScheduleService.getInstance();
      await schedule_service.deleteJob(job_schedule_id);
      return res.status(RESPONSE_SUCCESS).json(resOK(exam_attempt));
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }
}

export const examAttemptController = new ExamAttemptController();
