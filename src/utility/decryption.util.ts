import crypto from 'crypto';
import env from '../../env';

export class DecryptionUtil {
  private static readonly algorithm = 'aes-128-cbc';
  private static readonly aesKey = env.gc.aes_key;
  private static readonly aesIv = env.gc.aes_iv;

  static decryptPaymentData(encryptedValue: string): any {
    try {
      const urlDecoded = decodeURIComponent(encryptedValue);
      const encryptedBuffer = Buffer.from(urlDecoded, 'base64');

      const key = Buffer.from(this.aesKey, 'utf8').subarray(0, 16);
      const iv = Buffer.from(this.aesIv, 'utf8').subarray(0, 16);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Payment data decryption error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to decrypt payment data: ${errorMessage}`);
    }
  }

  static isValidEncryptedData(encryptedValue: string): boolean {
    try {
      const decrypted = this.decryptPaymentData(encryptedValue);
      return decrypted !== null && decrypted !== undefined;
    } catch (error) {
      return false;
    }
  }
}
