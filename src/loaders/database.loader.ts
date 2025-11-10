import { Dialect, Sequelize } from 'sequelize';
import env from '../../env';
import { Choices, Counter, File, Questions, Users, UserSearchModel, Comments } from '../models';

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
    // if (dbConfig.isSync) await sequelize.sync({ alter: true });
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

Questions.belongsTo(Users, { foreignKey: 'creatorId', as: 'creator' });
Questions.hasMany(Choices, { foreignKey: 'questionId', as: 'choices' });
Users.hasMany(Questions, { foreignKey: 'creatorId', as: 'questions' });
Choices.belongsTo(Questions, { foreignKey: 'questionId', as: 'question' });
Comments.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });

export const db = {
  sequalize: sequelize,
  users: Users,
  counter: Counter,
  file: File,
  connectToDatabase,
};
