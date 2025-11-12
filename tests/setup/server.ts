import express from 'express';
import expressLoader from '../../src/loaders/express.loader';

const app = express();
expressLoader(app);

export default app;
