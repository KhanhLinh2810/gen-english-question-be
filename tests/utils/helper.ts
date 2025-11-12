import request from 'supertest';
import app from '../setup/server';

export async function getAccessToken() {
  const res = await request(app).post('/api/auth/login').send({
    username: 'LinhTest',
    password: '123456',
  });
  return res.body.data.access_token;
}
