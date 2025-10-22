import i18n from 'i18n';
import path from 'path';

i18n.configure({
	locales: ['ja'],
	directory: path.join(process.cwd(), 'src', 'locales'),
	defaultLocale: 'ja',
	header: 'accept-language',
	updateFiles: false,
});

export default i18n;
