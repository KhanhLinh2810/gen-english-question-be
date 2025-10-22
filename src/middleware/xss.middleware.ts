import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

export function sanitizeObject(obj: any) {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      obj[key] = sanitizeObject(obj[key]);
    }
  }
  return obj;
}

export function xssMiddleware(req: Request, res: Response, next: NextFunction) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}
