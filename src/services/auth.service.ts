import jwt from 'jsonwebtoken';
import env from '../../env';
import { NOROUTE_ERROR } from '../constants/constants';
import { Users } from '../models';
import { AppError } from '../utility/appError.util';
import { EncUtil } from '../utility/encryption';

export class AuthService {
  private static instance: AuthService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async authenticate(username: string, password: string): Promise<Users> {
    const user = await Users.findOne({
      where: { username: username },
      attributes: ['id', 'password', 'username'],
    });
    if (!user) {
      throw new AppError(NOROUTE_ERROR, 'username_or_password_mismatch');
    }

    const isMatch = await EncUtil.comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError(NOROUTE_ERROR, 'username_or_password_mismatch');
    }
    return user;
  }

  getToken(
    user: { id: number; email: string },
    key: string,
    expiresIn = env.app.jwtExpiredIn,
  ): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      key,
      {
        expiresIn,
      },
    );
  }
}

// export async function register(user: Users): Promise<Users> {
// 	return await db.users.create(user);
// }

// export async function verify(token: string, password: string): Promise<Users> {
// 	const user = jwt.verify(token, env.app.jwtSecret) as Users;
// 	const userDb = await db.users.findOne({ where: { id: user.id } });
// 	if (userDb == null) {
// 		throw new AppError(PERMISSION_ERROR, 'User not found');
// 	}

// 	if (userDb.isVerified && !userDb.isForgotPassword) {
// 		throw new AppError(PERMISSION_ERROR, 'User already verified');
// 	}

// 	userDb.isVerified = true;
// 	userDb.isForgotPassword = false;
// 	userDb.password = await EncUtil.createHash(password);
// 	return await userDb.save();
// }

// export async function forgotPassword(email: string): Promise<Users> {
// 	const user = await db.users.findOne({ where: { email: email } });
// 	if (user == null) {
// 		throw new AppError(PERMISSION_ERROR, 'User not found');
// 	}

// 	user.isForgotPassword = true;

// 	const verityToken = getToken(user, env.app.jwtExpiredIn);
// 	const html = buildHtmlRegisterUser(verityToken);
// 	await sendMail(user.email, 'forgot password', undefined, html);

// 	return await user.save();
// }
