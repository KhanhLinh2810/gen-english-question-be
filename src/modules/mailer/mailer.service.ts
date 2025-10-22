import { Job, Queue, Worker } from 'bullmq';
import { createTransport, Transporter } from 'nodemailer';
import env from '../../../env';
import { Logger } from '../../utility/logger.util';
import { ISendMailOptions } from './interfaces/send-mail-options.interface';
import { AWSEmailService } from './aws-email.service';

export class MailerService {
  private static instance: MailerService;
  private readonly transport: Transporter;
  private readonly queue: Queue<ISendMailOptions>;
  private readonly logger = new Logger({ scope: MailerService.name });
  private readonly QUEUE_NAME = 'mail-sender';
  private readonly JOB_NAME = 'send-mail';
  private readonly awsEmailService: AWSEmailService;
  private readonly useAwsSes: boolean;

  constructor() {
    this.transport = createTransport(
      {
        host: env.mail.host,
        port: env.mail.port,
        auth: {
          user: env.mail.user,
          pass: env.mail.pass,
        },
      },
      {
        from: env.mail.from,
      },
    );

    this.queue = new Queue(this.QUEUE_NAME, {
      connection: {
        host: env.redis.host,
        port: env.redis.port,
      },
    });

    this.awsEmailService = AWSEmailService.getInstance();
    this.useAwsSes = !!(env.aws.accessKeyId && env.aws.secretAccessKey);

    if (this.useAwsSes) {
      this.logger.info(
        'AWS SES is enabled and will be used for sending emails',
      );
    } else {
      this.logger.info('Using traditional SMTP for sending emails');
    }

    this.createWorker();
  }

  createWorker() {
    const worker = new Worker(
      this.QUEUE_NAME,
      async (job: Job<ISendMailOptions>) => {
        try {
          this.logger.info(`Processing job ${job.id}`, {
            jobId: job.id,
            to: job.data.to,
            subject: job.data.subject,
            from: job.data.from || env.mail.from || 'default',
          });

          await this.sendMailSync(job.data);

          this.logger.info(`Job ${job.id} completed successfully`, {
            jobId: job.id,
            to: job.data.to,
            subject: job.data.subject,
          });
        } catch (error) {
          this.logger.error('Job failed', {
            jobId: job.id,
            jobName: job.name,
            error,
          });
          await worker.rateLimit(env.mail.limiter.duration);
          throw Worker.RateLimitError();
        }
      },
      {
        connection: {
          host: env.redis.host,
          port: env.redis.port,
        },
        concurrency: 10,
        limiter: env.mail.limiter,
      },
    );
    worker.on('completed', (job) => {
      this.logger.info(`Job ${job.name} completed`, {
        jobId: job.id,
        jobName: job.name,
      });
    });
    worker.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.name} failed`, {
        jobId: job?.id,
        jobName: job?.name,
        error,
      });
    });
    worker.on('error', (error) => {
      this.logger.error('Worker error', {
        error,
      });
    });
  }

  async sendMail(options: ISendMailOptions) {
    try {
      this.logger.debug('Adding email to queue', {
        to: options.to,
        subject: options.subject,
        from: options.from || env.mail.from || 'default',
      });

      const job = await this.queue.add(this.JOB_NAME, options);

      this.logger.debug('Email added to queue successfully', {
        jobId: job.id,
        to: options.to,
        subject: options.subject,
      });

      return job;
    } catch (error) {
      this.logger.error('Failed to add email to queue', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  async sendMailSync(options: ISendMailOptions) {
    try {
      this.logger.debug('Sending email', {
        to: options.to,
        subject: options.subject,
        from: options.from || env.mail.from || 'default',
      });

      if (this.useAwsSes) {
        const info = await this.awsEmailService.sendEmailWithBackup(options);
        this.logger.debug('Email sent successfully via AWS SES', {
          messageId: info.MessageId,
          to: options.to,
          subject: options.subject,
        });
        return info;
      }

      const info = await this.transport.sendMail(options);
      this.logger.debug('Email sent successfully via SMTP', {
        messageId: info.messageId,
        response: info.response,
        to: options.to,
        subject: options.subject,
      });

      return info;
    } catch (error) {
      this.logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  static getInstance(): MailerService {
    if (!MailerService.instance) {
      MailerService.instance = new MailerService();
    }
    return MailerService.instance;
  }

  static async sendMail(options: ISendMailOptions) {
    await MailerService.getInstance().sendMail(options);
  }

  static async sendMailSync(options: ISendMailOptions) {
    await MailerService.getInstance().sendMailSync(options);
  }
}
