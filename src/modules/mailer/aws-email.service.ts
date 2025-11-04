import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import imap, { ImapSimple } from 'imap-simple';
import nodemailer, { Transporter } from 'nodemailer';
import env from '../../../env';
import { Logger } from '../../utility/logger.util';
import { ISendMailOptions } from './interfaces/send-mail-options.interface';

export class AWSEmailService {
  private static instance: AWSEmailService;
  private readonly sesClient: SESClient;
  private readonly s3Client: S3Client;
  private readonly logger = new Logger({ scope: AWSEmailService.name });
  private readonly mailTransporter: Transporter;
  private imapConnection: ImapSimple | null = null;

  constructor() {
    this.sesClient = new SESClient({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    });

    this.s3Client = new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    });

    this.mailTransporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

    this.initializeImapConnection();
  }

  static getInstance(): AWSEmailService {
    if (!AWSEmailService.instance) {
      AWSEmailService.instance = new AWSEmailService();
    }
    return AWSEmailService.instance;
  }

  async sendEmailViaSES(options: ISendMailOptions): Promise<any> {
    try {
      this.logger.info('Sending email via AWS SES', {
        to: options.to,
        subject: options.subject,
      });

      const subject = options.subject || '';
      const htmlData = this.normalizeToString(options.html);
      const textData = this.normalizeToString(options.text);

      const command = new SendEmailCommand({
        Source: options.from || env.aws.ses.fromEmail,
        Destination: {
          ToAddresses: Array.isArray(options.to)
            ? options.to
            : options.to
            ? [options.to]
            : [],
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            ...(textData !== undefined ? { Text: { Data: textData } } : {}),
            ...(htmlData !== undefined ? { Html: { Data: htmlData } } : {}),
          },
        },
      });
      const response = await this.sesClient.send(command);

      this.logger.info('Email sent successfully via SES', {
        messageId: response.MessageId,
        to: options.to,
        subject: options.subject,
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to send email via SES', {
        error,
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  async backupEmailToS3(rawEmail: Buffer, messageId: string): Promise<any> {
    try {
      this.logger.info('Backing up email to S3', { messageId });

      const s3Params = {
        Bucket: env.aws.s3.bucket,
        Key: `emails/sent/${messageId}.eml`,
        Body: rawEmail,
        ContentType: 'message/rfc822',
      };

      const command = new PutObjectCommand(s3Params);
      const response = await this.s3Client.send(command);

      this.logger.info('Email backed up to S3 successfully', {
        messageId,
        s3Location: `s3://${env.aws.s3.bucket}/${s3Params.Key}`,
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to backup email to S3', {
        error,
        messageId,
      });
      throw error;
    }
  }

  private resetImapConnection(): void {
    if (this.imapConnection) {
      try {
        this.imapConnection.end();
        this.logger.debug('IMAP connection ended');
      } catch (endError) {
        this.logger.warn('Failed to end IMAP connection', { endError });
      } finally {
        this.imapConnection = null;
      }
    }
  }

  private async initializeImapConnection(): Promise<void> {
    try {
      this.imapConnection = await imap.connect({
        imap: {
          user: env.aws.workmail.user,
          password: env.aws.workmail.password,
          host: env.aws.workmail.host,
          port: env.aws.workmail.port,
          tls: true,
          authTimeout: 3000,
        },
      });
      await this.imapConnection.openBox('Sent Items');
      this.logger.info('IMAP connection initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize IMAP connection', { error });
      this.resetImapConnection();
    }
  }

  async syncToWorkMail(rawEmail: Buffer): Promise<void> {
    try {
      if (!this.imapConnection) {
        await this.initializeImapConnection();
      }

      await this.imapConnection!.append(rawEmail, {
        mailbox: 'Sent Items',
        flags: ['\\Seen'],
      });

      this.logger.info('Email synced to WorkMail successfully');
    } catch (error) {
      this.logger.error('Failed to sync email to WorkMail', { error });
      this.resetImapConnection();
    }
  }

  async sendEmailWithBackup(options: ISendMailOptions): Promise<any> {
    try {
      const sesResponse = await this.sendEmailViaSES(options);

      const rawEmail = await this.createRawEmail(options);

      if (sesResponse.MessageId) {
        await this.backupEmailToS3(rawEmail, sesResponse.MessageId);
      }

      await this.syncToWorkMail(rawEmail);

      return sesResponse;
    } catch (error) {
      this.logger.error('Failed to send email with backup', { error });
      throw error;
    }
  }

  private async createRawEmail(options: ISendMailOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.mailTransporter.sendMail(options, (err: any, info: any) => {
        if (err) return reject(err);
        if (!info.message || !Buffer.isBuffer(info.message)) {
          return reject(new Error('Raw email is not a Buffer'));
        }
        resolve(info.message);
      });
    });
  }

  private normalizeToString(value: any): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value;
    try {
      if (Buffer.isBuffer(value)) return value.toString('utf8');
      if (typeof value.toString === 'function') return value.toString();
    } catch {}
    return String(value);
  }
}
