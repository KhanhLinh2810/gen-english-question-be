import { NextFunction, Request, Response } from 'express';
import _, { attempt } from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { CustomRequest } from '../interfaces';
import { ExamAttemptService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';

export class ExamAttemptController {
  private readonly examAttemptService: ExamAttemptService;

  constructor() {
    this.examAttemptService = ExamAttemptService.getInstance();
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const { processedData, list_question, exam } =
        await this.examAttemptService.processCreateData(req.body, user.id);
      const exam_attempt = await this.examAttemptService.create(processedData);
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK({ ...exam_attempt.dataValues, list_question, exam }));
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
}

export const examAttemptController = new ExamAttemptController();
