import * as dotenv from 'dotenv';
import * as process from 'node:process';
import * as path from 'path';
import { description, name, version } from './package.json';

dotenv.config({
  path: path.join(process.cwd(), '.env'),
});

/**
 * Environment variables
 */

export default {
  app: {
    base_url: process.env.BASE_URL || 'http://localhost:3000',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelop: process.env.NODE_ENV === 'development',
    root_path: path.join(process.cwd()),
    name,
    version,
    description,
    port: Number(process.env.PORT) || 3000,
    saltRounds: process.env.SALT_ROUNDS || 10,
    cors: process.env.CORS?.split(',') || '*',
    jwtSecret: process.env['JWT_SECRET'] || '123456',
    jwtSecretClient: process.env['JWT_SECRET_CLIENT'] || '123456',
    jwtExpiredIn: process.env['JWT_EXPIRED_IN'] || '1d',
    debugLog: process.env.DEBUG_LOG === 'true',
    fe_base_url: process.env.FE_BASE_URL || 'http://localhost:3000',
    jwtSecretForLink: process.env['JWT_SECRET_FOR_LINK'] || '123456',
    clustering: process.env.CLUSTERING === 'true',
    maxWorkers: Number(process.env.MAX_WORKERS) || 2,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    name: process.env.DB_NAME || 'question_gen',
    dialect: process.env.DB_DIALECT || 'mysql',
    max: Number(process.env.DB_POOL_MAX) || 20,
    min: Number(process.env.DB_POOL_MIN) || 5,
    acquire: Number(process.env.DB_POOL_ACQUIRE) || 60000,
    idle: Number(process.env.DB_POOL_IDLE) || 10000,
    logging: process.env.DB_LOGGING === 'true',
    isSync: process.env.DB_SYNC === 'false',
    retryMax: Number(process.env.DB_RETRY_MAX) || 5,
    retryDelay: Number(process.env.DB_RETRY_DELAY) || 5000,
  },
  elastic: {
    url: process.env.ELASTIC_URL || 'https://elastic.com',
    api_key: process.env.ELASTIC_API_KEY || '123456',
  },
  mail: {
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT!) || 2525,
    user: process.env.MAIL_USER || '740ba294e9d57f',
    pass: process.env.MAIL_PASS || 'd5ff0cc1a9a948',
    from: process.env.MAIL_FROM_NAME || 'Platform',
    limiter: {
      max: parseInt(process.env.MAIL_LIMITER_MAX!) || 10,
      duration: parseInt(process.env.MAIL_LIMITER_DURATION!) || 1000,
    },
  },
  file: {
    limit_image_size: process.env.IMAGE_SIZE || '10485760', // 10 Mb
  },
  admin: {
    email: process.env.EMAIL || 'admin@gmail.com',
    password: process.env.PASSWORD || '123456',
    receivedNotiEmail: process.env.RECEIVED_NOTI_EMAIL || 'admin@gmail.com',
  },
  otp: {
    expiredIn: process.env.OTP_EXPIRED_IN || '30', // minutes
  },
  sms: {
    token: process.env.SMS_TOKEN || '3exx',
    clientId: process.env.SMS_CLIENT_ID || '12345',
    smsCode: process.env.SMS_CODE || '12345',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT!) || 6379,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    ses: {
      fromEmail: process.env.AWS_SES_FROM_EMAIL || '',
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET || '',
    },
    workmail: {
      host: process.env.WORKMAIL_IMAP_HOST || '',
      port: parseInt(process.env.WORKMAIL_IMAP_PORT!) || 993,
      user: process.env.WORKMAIL_USER || '',
      password: process.env.WORKMAIL_PASSWORD || '',
    },
  },
};
