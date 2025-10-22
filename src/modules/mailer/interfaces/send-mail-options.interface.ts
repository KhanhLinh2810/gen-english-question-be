import { SendMailOptions } from 'nodemailer';

export interface ISendMailOptions extends SendMailOptions {
  from?: string;
  to?: string | string[];
}
