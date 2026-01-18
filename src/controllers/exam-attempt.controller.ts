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
import * as ExcelJS from 'exceljs';

export class ExamAttemptController {
  private readonly examAttemptService: ExamAttemptService;

  constructor() {
    this.examAttemptService = ExamAttemptService.getInstance();
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterExamAttempt = { ...req.query, user_id: user.id };
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

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const { page, limit, offset, sortBy, sortOrder } = paginate(req);

      const filter: IFilterExamAttempt = { ...req.query, user_id: user.id };
      const data = await this.examAttemptService.getAll(filter, {
        limit,
        offset,
        order_by: sortBy,
        sort: sortOrder,
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `Thống_kê_điểm_${Date.now().toString()}`,
      );

      worksheet.columns = [
        { header: 'Tên bài thi', key: 'exam_title', width: 25 },
        { header: 'Thí sinh', key: 'username', width: 20 },
        { header: 'Bắt đầu', key: 'start', width: 20 },
        { header: 'Kết thúc', key: 'end', width: 20 },
        { header: 'Điểm số', key: 'score', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
      ];

      const formatDateTime = (dateStr: Date) => {
        const d = new Date(dateStr);
        const time = d.toLocaleTimeString('vi-VN', { hour12: false });
        const date = d.toLocaleDateString('vi-VN');
        return `${time}\n${date}`;
      };

      data.forEach((item) => {
        worksheet.addRow({
          exam_title: item.exam.title,
          username: item.user?.username || 'Người dùng ẩn danh',
          start: formatDateTime(item.started_at),
          end: item.finished_at ? formatDateTime(item.finished_at) : '-',
          score:
            item.finished_at && item.score != null
              ? `${Number(item.score).toFixed(1)}${
                  item.total_question
                    ? `/${Number(item.total_question).toFixed(1)}`
                    : ''
                }`
              : '-',
          status: item.finished_at ? 'Hoàn thành' : 'Đang làm',
        });
      });

      // 4. Cấu hình định dạng (Styling)
      // Định dạng Header
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        // cell.fill = {
        //   type: 'pattern',
        //   pattern: 'solid',
        //   fgColor: { argb: 'FFF2F4F7' },
        // };
      });

      // 2. Thiết lập Header HTTP
      const fileName = `Bao-Cao-${req.params.examId}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );

      // 3. Ghi trực tiếp vào response stream
      await workbook.xlsx.write(res);

      // Kết thúc response
      res.status(200).end();
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

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      const exam_attempt_id = _.toSafeInteger(req.params.id);
      const data = await this.examAttemptService.detailAfterSubmit(
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

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }

      const exam_attempt_id = _.toSafeInteger(req.params.id);
      await this.examAttemptService.destroy(exam_attempt_id, user.id);

      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK(null, 'Xóa bài làm thành công'));
    } catch (e) {
      next(e);
    }
  }
}

export const examAttemptController = new ExamAttemptController();
