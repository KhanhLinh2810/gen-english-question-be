import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST } from '../constants/constants';
import { AppError } from '../utility/appError.util';

function hasSql(value: any) {
  if (value === null || value === undefined) {
    return false;
  }

  // sql regex reference: http://www.symantec.com/connect/articles/detection-sql-injection-and-cross-site-scripting-attacks
  // Chỉ chặn -- khi có thêm context SQL injection, không chặn -- đơn thuần
  const sql_meta = new RegExp("(%27)|(')|(#)|(%23)", 'i');
  if (sql_meta.test(value)) {
    return true;
  }

  // Chặn -- chỉ khi có kèm theo các pattern SQL injection khác
  const sql_comment_injection = new RegExp(
    '(union|select|insert|update|delete|drop|create|alter).*--',
    'i',
  );
  if (sql_comment_injection.test(value)) {
    return true;
  }

  const sql_meta2 = new RegExp(
    "((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))",
    'i',
  );
  if (sql_meta2.test(value)) {
    return true;
  }

  const sql_typical = new RegExp(
    "w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))",
    'i',
  );
  if (sql_typical.test(value)) {
    return true;
  }

  const sql_union = new RegExp("((%27)|('))union", 'i');
  if (sql_union.test(value)) {
    return true;
  }
  const sql_randomblob = new RegExp('randomblob\\(\\d+\\)', 'i');
  if (sql_randomblob.test(value)) {
    return true;
  }

  return false;
}

export function checkSqlInjection(obj: any) {
  if (typeof obj === 'string') {
    return hasSql(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (checkSqlInjection(obj[key])) {
        return true;
      }
    }
  }
  return false;
}

export function sqlInjectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let hasSqlInjection = false;
  if (!hasSqlInjection && checkSqlInjection(req.body)) {
    hasSqlInjection = true;
  }
  if (!hasSqlInjection && checkSqlInjection(req.query)) {
    hasSqlInjection = true;
  }
  if (!hasSqlInjection && checkSqlInjection(req.params)) {
    hasSqlInjection = true;
  }

  // if (hasSqlInjection) {
  //   throw new AppError(BAD_REQUEST, 'sql_injection_detected');
  // }

  next();
}
