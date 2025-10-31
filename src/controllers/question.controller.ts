import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { RESPONSE_SUCCESS } from '../constants/constants';
import { QuestionDTO, ListQuestionResponse } from '../dtos/questions';
import { CustomRequest, IFilterQuestion } from '../interfaces';
import { QuestionService } from '../services/question.service';
import { resOK } from '../utility/HttpException';
import { paginate } from '../utility/utils';

export class QuestionController {
  private readonly questionService: QuestionService;

  constructor() {
    this.questionService = QuestionService.getInstance();
  }

  // GET /user/questions
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterQuestion = req.query;
      const data = await this.questionService.getMany(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });

      const listQuestion = new ListQuestionResponse(data.rows, data.count, page, limit);

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(listQuestion.data, 'success', data.count, limit, page));
    } catch (e) {
      next(e);
    }
  }

  // GET /user/questions/:id
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = _.toSafeInteger(req.params.id);
      const question = await this.questionService.findOrFailWithRelations(questionId);
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question)));
    } catch (e) {
      next(e);
    }
  }

  // POST /user/questions
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = user.id;
      console.log('Creating question for user ID:', userId);
      const data = req.body;

      const question = await this.questionService.create({
        ...data,
        creatorId: userId,
      });

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question)));
    } catch (e) {
      next(e);
    }
  }

  // PUT /user/questions/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = _.toSafeInteger(req.params.id);
      const data = req.body;
      const question = await this.questionService.update(questionId, data);
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(new QuestionDTO(question)));
    } catch (e) {
      next(e);
    }
  }

  // DELETE /user/questions/:id
  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const questionId = _.toSafeInteger(req.params.id);
      const question = await this.questionService.findOrFailWithRelations(questionId);
      await question.destroy();
      return res.status(RESPONSE_SUCCESS).json(resOK(null));
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
