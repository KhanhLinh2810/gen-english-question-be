import { NextFunction, Request, Response } from 'express';
import env from '../../env';
import { BAD_REQUEST, RESPONSE_SUCCESS } from '../constants/constants';
import { resOK } from '../utility/HttpException';
import { AuthService, UserService } from '../services';
import { TokenService } from '../modules';
import { CustomRequest } from '../interfaces';
import { AppError } from '../utility/appError.util';
import { EncUtil } from '../utility/encryption';

class AuthController {
  private readonly authService: AuthService;
  private readonly tokenService: TokenService;
  private readonly userService: UserService;

  constructor() {
    this.authService = AuthService.getInstance();
    this.tokenService = TokenService.getInstance();
    this.userService = UserService.getInstance();
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.authenticate(
        req.body.username,
        req.body.password,
      );
      const token = this.authService.getToken(
        user,
        env.app.jwtSecret,
        env.app.jwtExpiredIn,
      );
      await this.tokenService.saveToken(token, user.id);
      return res
        .status(RESPONSE_SUCCESS)
        .json(resOK({ access_token: token }, res.__('login_success')));
    } catch (e) {
      next(e);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as CustomRequest).user;
      if (!user) {
        throw new AppError(BAD_REQUEST, 'user_not_found');
      }
      await this.tokenService.unsaveToken(user.id);
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      await this.userService.validateUsernameAndEmail(username, email);
      await this.userService.create({
        username,
        email,
        password: await EncUtil.createHash(password),
      });
      return res.status(RESPONSE_SUCCESS).json(resOK());
    } catch (e) {
      next(e);
    }
  }
}

export const authController = new AuthController();
// export const register = async (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction,
// ) => {
// 	try {
// 		req.body.email = req.body.email.toLowerCase();
// 		const params: Users = req.body;
// 		const userDb = await userService.getOne({ email: req.body.email });
// 		if (userDb !== null) {
// 			throw new AppError(PERMISSION_ERROR, 'email already verified');
// 		}

// 		const hashPassword = await EncUtil.createHash(req.body.password);
// 		const user = await authService.register({
// 			...params,
// 			password: hashPassword,
// 		} as Users);

// 		return res.status(RESPONSE_SUCCESS).json(resOK(user));
// 	} catch (e) {
// 		next(e);
// 	}
// };

// export const verify = async (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction,
// ) => {
// 	try {
// 		const { token, password} = req.body;
// 		const user = await authService.verify(token, password);
// 		return res.status(RESPONSE_SUCCESS).json(resOK(user));
// 	} catch (e) {
// 		next(e);
// 	}
// }

// export const forgotPassword = async (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction,
// ) => {
// 	try {
// 		const { email } = req.body;
// 		const user = await authService.forgotPassword(email);
// 		return res.status(RESPONSE_SUCCESS).json(resOK(user));
// 	} catch (e) {
// 		next(e);
// 	}
// }
