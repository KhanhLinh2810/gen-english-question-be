import { NextFunction, Request, Response } from 'express';

export function trimData(data: any) {
  function trimRecursive(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object') {
        trimRecursive(obj[key]);
      }
    }
  }
  trimRecursive(data);
}

export function validateTrimData(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    trimData(req.body);
    trimData(req.query);
    next();
  } catch (error) {
    next(error);
  }
}
