import KeyvRedis, { Keyv } from '@keyv/redis';
import { createCache } from 'cache-manager';
import env from '../../../env';

export class CacheService {
  private static instance: CacheService;
  private cache: any;

  constructor() {
    this.cache = createCache({
      stores: [
        new Keyv({
          store: new KeyvRedis(
            `redis://:${env.redis.password}@${env.redis.host}:${env.redis.port}`,
          ),
        }),
      ],
    });
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  static async set(key: string, value: string, ttl = 1800000) {
    // ttl milisecond
    await CacheService.getInstance().cache.set(key, value, ttl);
  }

  static async get(key: string) {
    return await CacheService.getInstance().cache.get(key);
  }

  static async del(key: string) {
    return await CacheService.getInstance().cache.del(key);
  }
}
