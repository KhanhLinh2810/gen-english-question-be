import { Dialect, Sequelize } from 'sequelize';
import env from '../../env';
import {
  Choices,
  Counter,
  ExamAttempts,
  Exams,
  File,
  Questions,
  Users,
  UserSearchModel,
  Ratings,
  Comments,
} from '../models';

const dbConfig = env.database;

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect as Dialect,
    port: dbConfig.port,
    pool: {
      max: dbConfig.max,
      min: dbConfig.min,
      acquire: dbConfig.acquire,
      idle: dbConfig.idle,
    },
    logging: dbConfig.logging,
    retry: {
      max: dbConfig.retryMax,
      match: [
        /ConnectionError/,
        /ConnectionRefusedError/,
        /ConnectionTimedOutError/,
        /TimeoutError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
    },
  },
);

const connectToDatabase = async (retries: number = 0): Promise<void> => {
  const maxRetries = dbConfig.retryMax || 5;
  const retryDelay = dbConfig.retryDelay || 5000;

  try {
    await sequelize.authenticate();
    // Nếu đang ở môi trường phát triển hoặc DB sync được bật trong config thì tự động sync (tạo/alter bảng)
    if (env.app.isDevelop || dbConfig.isSync) {
      console.log(
        'Auto syncing database models to the DB (may alter tables)...',
      );
      try {
        await sequelize.sync({ alter: false });
      } catch (syncError: any) {
        // Ignore sync errors (e.g., too many keys) - database structure is already correct
        if (syncError?.parent?.code !== 'ER_TOO_MANY_KEYS') {
          console.warn('Database sync warning:', syncError.message);
        }
      }
    }
    console.log(
      `Database connection established successfully (PID: ${process.pid})`,
    );
  } catch (error) {
    console.error(`Database connection failed (PID: ${process.pid}):`, error);

    if (retries < maxRetries) {
      console.log(
        `Retrying database connection in ${retryDelay}ms... (Attempt ${
          retries + 1
        }/${maxRetries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return connectToDatabase(retries + 1);
    } else {
      console.error(
        `Failed to connect to database after ${maxRetries} attempts`,
      );
      throw error;
    }
  }
};

Users.initClass(sequelize);
UserSearchModel.initClass(sequelize);
Counter.initClass(sequelize);
File.initClass(sequelize);
Questions.initClass(sequelize);
Choices.initClass(sequelize);
Comments.initClass(sequelize);
Ratings.initClass(sequelize);

Users.hasMany(Questions, { foreignKey: 'creatorId', as: 'questions' });
Exams.initClass(sequelize);
ExamAttempts.initClass(sequelize);

Questions.associate?.();
Choices.associate?.();
Exams.associate?.();
ExamAttempts.associate?.();
Ratings.associate();
Comments.associate();

export const db = {
  sequalize: sequelize,
  users: Users,
  counter: Counter,
  file: File,
  connectToDatabase,
};
