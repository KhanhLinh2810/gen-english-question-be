import { HttpStatusCode } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utility/appError.util';

interface ErrorInterface extends Error {
  statusCode?: number;
}

export const handleError = (
  error: ErrorInterface,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('error', error);

  const statusCode = error.statusCode || HttpStatusCode.InternalServerError;
  const responseData: any = {
    statusCode,
    code: 'error',
    message:
      error.statusCode === HttpStatusCode.InternalServerError
        ? req.__('internal_server_error')
        : req.__(error.message),
  };
  if (error instanceof AppError) {
    responseData.message = req.__(error.message);
    responseData.code = error.code;
    if (error.data) {
      responseData.data = error.data;
    }
  }

  return res.status(statusCode).json(responseData);
};
