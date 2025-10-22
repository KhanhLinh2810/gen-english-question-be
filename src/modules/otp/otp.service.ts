export class OTPService {
  private static instance: OTPService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // async sendOtp(client: Client) {
  //   const code = generateRandomString(6);
  //   const resendOtp = generateRandomString(12);

  //   const ttl = toSafeInteger(env.otp.expiredIn) * 60000;

  //   await CacheService.set(client.email, code, ttl);
  //   await CacheService.set(`${client.email}_resend_otp`, resendOtp, ttl);

  //   const html = buildHTMLOtpClientLogin(client.name, code);
  //   await sendMail(client.email, '【GBase】ログイン認証コード', undefined, html);

  //   return resendOtp;
  // }

  // async verifyOtp(email: string, code: string) {
  //   const existCode = await CacheService.get(email);
  //   if (existCode && code === existCode) {
  //     await CacheService.del(email);
  //     return true;
  //   }
  //   return false;
  // }

  // async verifyResendOtp(email: string, code: string) {
  //   const existCode = await CacheService.get(`${email}_resend_otp`);
  //   if (existCode && code === existCode) {
  //     return true;
  //   }
  //   return false;
  // }
}
