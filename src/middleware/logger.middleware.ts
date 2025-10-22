import { NextFunction, Request, Response } from 'express';
import { Logger } from '../utility/logger.util';

const logger = new Logger({ scope: 'RequestLogger' });

/**
 * Middleware to log HTTP requests and responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  // Log request
  logger.request(req.method, req.path, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.response(req.method, req.path, res.statusCode, duration, {
      requestId,
      ip: req.ip,
      userId: (req as any).user?.id,
      contentLength: res.get('Content-Length'),
      userAgent: req.get('User-Agent')
    });

    // Call original end method
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

/**
 * Middleware to log errors
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.error('Request error', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.id,
    error: error.message,
    stack: error.stack,
    userAgent: req.get('User-Agent')
  });

  next(error);
};

/**
 * Middleware to log security events
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log failed authentication attempts
  if (res.statusCode === 401) {
    logger.security('authentication_failed', 'medium', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
  }

  // Log forbidden access attempts
  if (res.statusCode === 403) {
    logger.security('access_forbidden', 'medium', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      userAgent: req.get('User-Agent')
    });
  }

  // Log suspicious activity (multiple 4xx errors from same IP)
  // This would typically be implemented with rate limiting middleware

  next();
};

/**
 * Middleware to log performance metrics
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      logger.performance('slow_request', duration, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  });

  next();
}; 