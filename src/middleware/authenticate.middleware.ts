import { NextFunction, Request, Response } from 'express';
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from 'jsonwebtoken';
import { PERMISSION_ERROR } from '../constants/constants';
import { UserDTO } from '../dtos';
import { CustomRequest } from '../interfaces';
import { Users } from '../models';
import { UserService } from '../services';
import { AppError } from '../utility/appError.util';
import { TokenService } from '../modules';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AppError(PERMISSION_ERROR, 'unauthenticated');
    }
    const jwtScret: string = process.env.JWT_SCRET || '123456';
    const payload: JwtPayload | string = jwt.verify(token, jwtScret);
    if (typeof payload !== 'object' || !payload.id || !payload.iat) {
      throw new AppError(PERMISSION_ERROR, 'invalid_token_payload');
    }
    const tokenService = TokenService.getInstance();
    if (!(await tokenService.verifyToken(token, payload.id))) {
      throw new AppError(PERMISSION_ERROR, 'unauthenticated');
    }

    const userService = UserService.getInstance();
    const user = await userService.findOrFail(payload.id);

    (req as CustomRequest).user = new UserDTO(user.dataValues as Users);
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new AppError(PERMISSION_ERROR, 'token_expired'));
    } else if (error instanceof JsonWebTokenError) {
      next(new AppError(PERMISSION_ERROR, 'token_invalid'));
    }
    next(error);
  }
};
