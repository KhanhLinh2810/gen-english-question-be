import express from 'express';
import http from 'http';
import env from './env';
import { db } from './src/loaders/database.loader';
import ExpressLoader from './src/loaders/express.loader';
import { router } from './src/routers';

async function main() {
  try {
    process.on('SIGTERM', () => {
      console.log(`Process ${process.pid} received a SIGTERM signal`);
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log(`Process ${process.pid} has been interrupted`);
      process.exit(0);
    });

    process.on('uncaughtException', (err) => {
      console.log(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.log('Unhandled rejection at ', promise, `reason: ${reason}`);
      process.exit(1);
    });
    const app = express();
    const serverHttp = http.createServer(app);
    await db.connectToDatabase();
    ExpressLoader(app);
    const port = env.app.port;
    serverHttp.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.log('error', error);
  }
}

main();
