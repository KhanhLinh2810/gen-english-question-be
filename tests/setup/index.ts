import { db } from '../../src/loaders/database.loader';
import { getAccessToken } from '../utils/helper';

beforeAll(async () => {
  await db.connectToDatabase();
  process.env.TEST_TOKEN = await getAccessToken();
});

afterAll(async () => {
  await db.sequalize.close();
});
