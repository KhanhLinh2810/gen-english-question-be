import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { ListQuestionDTO, QuestionDTO } from '../dtos';
import { CustomRequest, IFilterQuestion } from '../interfaces';
import { db } from '../loaders/database.loader';
import { QuestionService } from '../services';
import { AppError } from '../utility/appError.util';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';

export class QuestionController {
  private readonly questionService: QuestionService;

  constructor() {
    this.questionService = QuestionService.getInstance();
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterQuestion = req.query;
      if (filter.is_current_user_only) {
        filter.user_id = user.id;
      }
      const data = await this.questionService.getMany(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });

      // const listQuestion = new ListQuestionResponse(
      //   data.rows,
      //   data.count,
      //   page,
      //   limit,
      // );

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(data, 'success', data.count, limit, page));
    } catch (e) {
      next(e);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = _.toSafeInteger(req.params.id);
      const question = await this.questionService.findOrFailWithRelations(
        questionId,
      );
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question)));
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

      this.questionService.validateParams(data);
      const question = await this.questionService.create({
        ...data,
        creator_id: user.id,
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question, user)));
    } catch (e) {
      next(e);
    }
  }

  async createMany(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const processData = this.questionService.processCreateListQuestionData(
        req.body.questions,
        user.id,
      );
      const data = await this.questionService.createMany(processData);
      const dto = new ListQuestionDTO(data, user);
      return res.status(RESPONSE_SUCCESS).json(resOK(dto.questionDtos));
    } catch (e) {
      next(e);
    }
  }

  async createAutomaticQuestion(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const data = await this.questionService.createAutomaticQuestion(req.body);
      return res.status(RESPONSE_SUCCESS).json(resOK(data));
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

      const question = await this.questionService.update(
        _.toSafeInteger(req.params.id),
        req.body,
        user.id,
        transaction,
      );
      await transaction.commit();
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question)));
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

      const question = await this.questionService.findOrFailWithRelations(
        _.toSafeInteger(req.params.id),
        user.id,
      );
      await question.destroy();
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }

  // POST /user/questions/import-moodle
  //   async importMoodle(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const data = req.body; // mảng câu hỏi
  //       const questions = await this.questionService.importFromMoodle(data);
  //       return res.status(RESPONSE_SUCCESS).json(resOK(questions));
  //     } catch (e) {
  //       next(e);
  //     }
  //   }

  // POST /user/questions/generation
  //   async generate(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const criteria = req.body; // thông tin tạo câu hỏi tự động
  //       const questions = await this.questionService.generateQuestions(criteria);
  //       return res.status(RESPONSE_SUCCESS).json(resOK(questions));
  //     } catch (e) {
  //       next(e);
  //     }
  //   }
}

export const questionController = new QuestionController();
