import i18n from 'i18n';
import path from 'path';

i18n.configure({
  locales: ['vi'],
  directory: path.join(process.cwd(), 'src', 'locales'),
  defaultLocale: 'vi',
  header: 'accept-language',
  updateFiles: false,
});

export default i18n;
