import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import env from '../../env';
import { handleError } from '../exceptions/error.exeption';
import { sqlInjectionMiddleware } from '../middleware/sql-injection.middleware';
import { validateTrimData } from '../middleware/trim.middleware';
import { xssMiddleware } from '../middleware/xss.middleware';
import { router as apiRoute } from '../routers';
import i18n from '../utility/i18n.util';

export default (app: express.Application) => {
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';

    if (env.app.cors === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (env.app.cors.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header(
      'Access-Control-Allow-Methods',
      'GET, HEAD, OPTIONS, PUT, PATCH, POST, DELETE',
    );
    res.header(
      'Access-Control-Allow-Headers',
      `Content-Type, Origin, X-Requested-With, Accept, Authorization, access-token, X-Access-Token`,
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('preflightContinue', 'false');

    if (req.method === 'OPTIONS') {
      res.send(200);
    } else {
      next();
    }
  });

  app.use(
    morgan('dev', {
      skip: (req, res) => {
        return res.statusCode < 400;
      },
      stream: process.stderr,
    }),
  );

  app.use(
    morgan('dev', {
      skip: (req, res) => {
        return res.statusCode >= 400;
      },
      stream: process.stdout,
    }),
  );

  app.use(i18n.init);
  app.use((req, res, next) => {
    const preferredLocale = 'vi';
    req.setLocale(preferredLocale);
    next();
  });

  const staticOptions = {
    setHeaders: (res: Response) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  };

  app.use(
    helmet({
      xContentTypeOptions: true,

      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'script-src': ["'none'"],
          'style-src': ["'none'"],
          'font-src': ["'none'"],
          'img-src': ["'none'"],
          'connect-src': ["'self'"],
        },
      },
    }),
    express.json({ limit: '5mb' }),
    express.urlencoded({ extended: true }),
  );
  app.disable('x-powered-by');

  app.use('/uploads', express.static('uploads'));

  app.use(sqlInjectionMiddleware);
  app.use(xssMiddleware);
  app.use(validateTrimData);

  app.use('/api', apiRoute);

  app.all('*', (req: Request, res: Response, next: NextFunction) => {
    res.status(400).send('not found');
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    handleError(err, req, res, next);
  });
};
