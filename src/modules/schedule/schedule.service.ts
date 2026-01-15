import { Queue, Worker, JobsOptions, Job } from 'bullmq';
import env from '../../../env';
import { ExamAttemptService } from '../../services';
import { SCHEDULE_JOB_NAME } from '../../constants/constants';

export class ScheduleService {
  private static instance: ScheduleService;
  private queue: Queue;
  private readonly connection = {
    url: env.redis.url,
    tls: { rejectUnauthorized: false },
  };

  private constructor() {
    this.queue = new Queue('schedule-queue', {
      connection: this.connection,
    });
    new Worker(
      'schedule-queue',
      async (job: Job) => {
        switch (job.name) {
          case SCHEDULE_JOB_NAME.SUBMIT_EXAM:
            try {
              const { id } = job.data;
              const examAttemptService = ExamAttemptService.getInstance();
              await examAttemptService.submitBySystem(id);
            } catch (error) {
              console.error('have error when run submit exam', error);
            }
            break;
          default:
            break;
        }
      },
      { connection: this.connection },
    );
  }

  static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      console.log(
        '____________________________schedule_______________________',
      );
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  async addJob(name: string, data: any = {}, options: JobsOptions = {}) {
    console.log(
      '____________________________add job schedule_______________________',
    );
    return await this.queue.add(name, data, options);
  }

  async deleteJob(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  // schedule lên lịch check lại đáp án câu hỏi
}
