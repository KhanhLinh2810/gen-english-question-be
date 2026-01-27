import { Request } from 'express';
import { checkSqlInjection } from './sql-injection.middleware';
import { trimData } from './trim.middleware';
import { sanitizeObject } from './xss.middleware';

function normalizeBody(body: any) {
  return JSON.parse(JSON.stringify(body || {}));
}

export const validateFieldInFormData = (req: Request) => {
  req.body = normalizeBody(req.body);
  req.query = normalizeBody(req.query);
  req.params = normalizeBody(req.params);

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  // if (
  //   checkSqlInjection(req.body) ||
  //   checkSqlInjection(req.query) ||
  //   checkSqlInjection(req.params)
  // ) {
  //   return 'sql_injection_detected';
  // }
  if (false) {
    return '';
  }

  trimData(req.body);
  trimData(req.query);
  trimData(req.params);
};
