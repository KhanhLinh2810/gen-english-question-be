import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env from '../../env';

// Log levels configuration
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

// Log context interface for structured logging
export interface LogContext {
  [key: string]: any;
  userId?: string | number;
  requestId?: string;
  sessionId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  stack?: string;
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp?: Date;
  scope?: string;
}

// Logger configuration interface
export interface LoggerConfig {
  scope?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  logLevel?: LogLevel;
  maxFiles?: string;
  maxSize?: string;
}

const configRotateFile = {
  dirname: 'logs',
  maxFiles: '60d',
  zippedArchive: true,
  maxSize: '20m',
};

const logFormat = winston.format.printf(({ level, message, timestamp, scope, context }) => {
  const baseLog = `${timestamp} [${level.toUpperCase()}] ${scope ? `[${scope}] ` : ''}${message}`;
  
  if (context && Object.keys(context).length > 0) {
    return `${baseLog} | Context: ${JSON.stringify(context)}`;
  }
  
  return baseLog;
});

const fileLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new DailyRotateFile({
      ...configRotateFile,
      filename: 'error.%DATE%.log',
      level: LogLevel.ERROR,
    }),
    new DailyRotateFile({
      ...configRotateFile,
      filename: 'combined.%DATE%.log',
      level: LogLevel.INFO,
    }),
  ],
});

const consoleLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, scope, context }) => {
      const baseLog = `${timestamp} [${level}] ${scope ? `[${scope}] ` : ''}${message}`;
      
      if (context && Object.keys(context).length > 0) {
        return `${baseLog}\nContext: ${JSON.stringify(context, null, 2)}`;
      }
      
      return baseLog;
    })
  ),
  transports: [new winston.transports.Console()],
  level: LogLevel.DEBUG,
});

export class Logger {
  private scope: string;
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.scope = config.scope || 'App';
    this.config = {
      enableConsole: true,
      enableFile: true,
      logLevel: LogLevel.INFO,
      maxFiles: '60d',
      maxSize: '20m',
      ...config,
    };
  }

  /**
   * Create a new logger instance with a specific scope
   */
  createScope(scope: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      scope,
      ...config,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: LogContext): void {
    this.log(LogLevel.VERBOSE, message, context);
  }

  /**
   * Log method entry
   */
  enter(methodName: string, params?: any, context?: LogContext): void {
    this.debug(`Entering method: ${methodName}`, {
      ...context,
      method: methodName,
      params: this.sanitizeData(params),
    });
  }

  /**
   * Log method exit
   */
  exit(methodName: string, result?: any, context?: LogContext): void {
    this.debug(`Exiting method: ${methodName}`, {
      ...context,
      method: methodName,
      result: this.sanitizeData(result),
    });
  }

  /**
   * Log API request
   */
  request(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      method,
      path,
    });
  }

  /**
   * Log API response
   */
  response(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    });
  }

  /**
   * Log database query
   */
  query(sql: string, duration: number, context?: LogContext): void {
    this.debug(`Database Query (${duration}ms): ${sql}`, {
      ...context,
      duration,
      sql: this.truncateString(sql, 200),
    });
  }

  /**
   * Log payment processing
   */
  payment(operation: string, amount: number, currency: string, context?: LogContext): void {
    this.info(`Payment ${operation}: ${amount} ${currency}`, {
      ...context,
      operation,
      amount,
      currency,
    });
  }

  /**
   * Log webhook event
   */
  webhook(event: string, source: string, context?: LogContext): void {
    this.info(`Webhook ${event} from ${source}`, {
      ...context,
      event,
      source,
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, userId: string | number, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      userId,
    });
  }

  /**
   * Log security event
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(level, `Security Event [${severity.toUpperCase()}]: ${event}`, {
      ...context,
      event,
      severity,
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration,
    });
  }

  /**
   * Log business event
   */
  business(event: string, entityType: string, entityId: string | number, context?: LogContext): void {
    this.info(`Business Event: ${event}`, {
      ...context,
      event,
      entityType,
      entityId,
    });
  }

  /**
   * Main logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      level,
      message: this.formatMessage(message),
      context: this.sanitizeContext(context),
      timestamp: new Date(),
      scope: this.scope,
    };

    if (this.config.enableFile) {
      fileLogger[level](logEntry.message, { context: logEntry.context, scope: logEntry.scope });
    }

    if (this.config.enableConsole && env.app.debugLog) {
      consoleLogger[level](logEntry.message, { context: logEntry.context, scope: logEntry.scope });
    }
  }

  /**
   * Format message with scope
   */
  private formatMessage(message: string): string {
    return message;
  }

  /**
   * Sanitize context data to remove sensitive information
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize data for logging
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'object') {
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });

      return sanitized;
    }

    return data;
  }

  /**
   * Truncate string to specified length
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * Get current scope
   */
  getScope(): string {
    return this.scope;
  }

  /**
   * Set scope
   */
  setScope(scope: string): void {
    this.scope = scope;
  }

  /**
   * Get logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create default logger instance
const defaultLogger = new Logger();

// Export both the class and default instance
export default defaultLogger;

// Export convenience functions for backward compatibility
export const debug = (message: string, context?: LogContext) => defaultLogger.debug(message, context);
export const info = (message: string, context?: LogContext) => defaultLogger.info(message, context);
export const warn = (message: string, context?: LogContext) => defaultLogger.warn(message, context);
export const error = (message: string, context?: LogContext) => defaultLogger.error(message, context);
export const verbose = (message: string, context?: LogContext) => defaultLogger.verbose(message, context);
