// import { db } from '../../../src/loaders/database.loader';
// import request from 'supertest';
// import app from '../../setup/server';
// import {
//   expect_bad_request,
//   expect_permission_error,
//   expect_valid_response,
// } from '../../utils/response';

// describe('POST /api/auth/register', () => {
//   it('success', async () => {
//     const now = new Date().getTime().toString();
//     const res = await request(app)
//       .post('/api/auth/register')
//       .send({
//         username: 'LinhTest' + now,
//         email: 'linh@test.com' + now,
//         password: '123456',
//       });

//     expect_valid_response(res);
//   });

//   const invalid_cases = [
//     {
//       name: 'username_or_email_already_exists',
//       body: {
//         username: 'LinhTest',
//         email: 'linh@test.com',
//         password: '123456',
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//     {
//       name: 'username_or_password_mismatch',
//       body: {
//         username: 'LinhTest',
//         email: 'linh1@test.com',
//         password: '123456',
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//     {
//       name: 'email_already_exists',
//       body: {
//         username: 'LinhTest1',
//         email: 'linh@test.com',
//         password: '123456',
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//   ];

//   it.each(invalid_cases)('%s', async ({ body, expected }) => {
//     const res = await request(app).post('/api/auth/register').send(body);
//     expect_bad_request(res, expected.code);
//   });
// });

// describe('POST /api/auth/login', () => {
//   it('success', async () => {
//     const res = await request(app).post('/api/auth/login').send({
//       username: 'LinhTest',
//       password: '123456',
//     });
//     expect_valid_response(res);
//   });

//   const invalid_cases = [
//     {
//       name: 'username_or_password_mismatch',
//       body: {
//         username: 'LinhTest',
//         password: 'wrong_password',
//       },
//       expected: { code: 'username_or_password_mismatch' },
//     },
//     {
//       name: 'username_or_password_mismatch',
//       body: {
//         username: 'wrong_username',
//         password: '123456',
//       },
//       expected: { code: 'username_or_password_mismatch' },
//     },
//   ];

//   it.each(invalid_cases)('%s', async ({ body, expected }) => {
//     const res = await request(app).post('/api/auth/login').send(body);
//     expect_bad_request(res, expected.code);
//   });
// });

// describe('POST /api/auth/logout', () => {
//   let token: string;
//   beforeAll(async () => {
//     await db.connectToDatabase();

//     const now = new Date().getTime().toString();
//     await request(app)
//       .post('/api/auth/register')
//       .send({
//         username: now,
//         email: now + '@gmail.com',
//         password: '123456',
//       });

//     const res = await request(app).post('/api/auth/login').send({
//       username: now,
//       password: '123456',
//     });
//     token = res.body.data.access_token;
//   });
//   it('success', async () => {
//     const res = await request(app)
//       .post('/api/auth/logout')
//       .set('Authorization', `Bearer ${token}`);
//     expect_valid_response(res);
//   });

//   it('invalid_token', async () => {
//     const res = await request(app)
//       .post('/api/auth/logout')
//       .set('Authorization', `Bearer ${token}`);

//     expect_permission_error(res, [
//       'token_expired',
//       'token_invalid',
//       'unauthenticated',
//       'invalid_token_payload',
//       'user_not_found',
//     ]);
//   });
// });
