import env from '../../env';
import { MailerService } from '../modules/mailer';

export const sendMail = async (
	toUsers: string,
	subject: string,
	text?: string,
	html?: string,
) => {
	await MailerService.sendMail({
		from: env.mail.from,
		to: toUsers,
		subject,
		text,
		html,
	});
};
