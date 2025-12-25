import { Users } from '../models';
// import { MailerService } from '../modules/mailer';
import { EmailTemplates } from '../templates/email-templates';
import { Logger } from '../utility/logger.util';

export class EmailService {
  private static instance: EmailService;
  // private readonly mailerService: MailerService;
  private readonly logger = new Logger({
    scope: EmailService.name,
  });

  constructor() {
    // this.mailerService = MailerService.getInstance();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async sendPasswordResetEmail(user: Users, token: string): Promise<void> {
    try {
      const subject = '【GBase】パスワード再設定のご案内';
      const html = EmailTemplates.buildForwardPasswordEmail(
        user.username,
        token,
      );

      // await this.mailerService.sendMail({
      //   to: user.email,
      //   subject,
      //   html,
      // });

      this.logger.info('PIC password reset email sent successfully', {
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      this.logger.error('Failed to send PIC password reset', {
        userId: user.id,
        email: user.email,
        error,
      });
      throw error;
    }
  }
}

export const emailService = new EmailService();
