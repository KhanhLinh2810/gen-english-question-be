import _ from 'lodash';
import env from '../../../env';
import { CacheService } from '../cache';

export class TokenService {
  private static instance: TokenService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async saveToken(token: string, userId: number): Promise<void> {
    const ttl = _.toSafeInteger(env.app.jwtExpiredIn) * 60000;
    await CacheService.set(`token_user_id_${userId}`, token, ttl);
  }

  async verifyToken(token: string, userId: number): Promise<boolean> {
    const savedToken = await CacheService.get(`token_user_id_${userId}`);
    if (savedToken && token === savedToken) {
      return true;
    }
    return false;
  }

  async unsaveToken(userId: number): Promise<boolean> {
    const savedToken = await CacheService.get(`token_user_id_${userId}`);
    if (savedToken) {
      await CacheService.del(`token_user_id_${userId}`);
      return true;
    }
    return false;
  }
}
