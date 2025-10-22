import bcrypt = require('bcryptjs');
import env from '../../env';

export class EncUtil {
	static async createHash(data: string): Promise<string> {
		return bcrypt.hash(data, env.app.saltRounds);
	}
	static async comparePassword(data: string, hash: string): Promise<boolean> {
		return bcrypt.compare(data, hash);
	}
}
