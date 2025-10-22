import env from '../../env';

export class EmailTemplates {
  static buildForwardPasswordEmail(name: string, token: string): string {
    const url = `${env.app.fe_base_url}/admin/reset-password?token=${token}`;

    return `
    <div>
      <p>${name}様</p>

      <p>いつもご利用いただきありがとうございます。</p>

      <p>パスワードの再設定を行うには、以下のリンクをクリックしてから新しいパスワードを設定してください。</p>

      <a href="${url}">[パスワード再設定]</a>

      <p>このリンクは、発行から24時間有効となっておりますので、それまでにお手続きください。</p>

      <p>もしこのリクエストに覚えがない場合は、このメールを無視してください。<br>
      ご不明な点がございましたら、お気軽にお問い合わせください。</p>

      <p>くらしエイド<br>
        カスタマーサポート：0120-124-052<br>
        Email：info_sys@sys-global-cast.jp</p>
    </div>
  `;
  }
}
