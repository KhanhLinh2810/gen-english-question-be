// import request from 'supertest';
// import app from '../../setup/server';
// import {
//   expect_bad_request,
//   expect_date_data,
//   expect_list_data,
//   expect_valid_response,
// } from '../../utils/response';

// let user_id: number;

// describe('GET /api/user/me', () => {
//   it('success', async () => {
//     const res = await request(app)
//       .get('/api/user/me')
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
//     expect_valid_response(res);
//     expect(res.body).toHaveProperty('data');

//     const data = res.body.data;
//     expect(typeof data).toBe('object');
//     expect_user_item(data);
//   });
// });

// describe('GET /api/user/list', () => {
//   it('success', async () => {
//     const res = await request(app)
//       .get('/api/user/list')
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);

//     expect_list_data(res);

//     const data = res.body.data;
//     for (const item of data) {
//       expect(typeof item).toBe('object');
//       expect_user_item(item);
//     }
//     user_id = data[0].id;
//   });
// });

// describe('GET /api/user/{id}', () => {
//   it('success', async () => {
//     const res = await request(app)
//       .get(`/api/user/${user_id}`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
//     expect_valid_response(res);
//     expect(res.body).toHaveProperty('data');

//     const data = res.body.data;
//     expect(typeof data).toBe('object');
//     expect_user_item(data);
//   });
// });

// describe('PUT /api/user', () => {
//   const now = new Date().getTime().toString();
//   const exist_username = 'new_' + now;
//   const exist_email = 'new_' + now + '@gmail.com';
//   beforeAll(async () => {
//     await request(app).post('/api/auth/register').send({
//       username: exist_username,
//       email: exist_email,
//       password: '123456',
//     });
//   });

//   afterAll(async () => {
//     await request(app)
//       .put(`/api/user`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send({
//         username: 'LinhTest',
//         email: 'linh@test.com',
//       });
//   });

//   it('success', async () => {
//     const res = await request(app)
//       .put(`/api/user`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send({
//         username: now + '_update',
//         email: now + '_update@gmail.com',
//       });

//     expect_valid_response(res);
//     expect(res.body).toHaveProperty('data');

//     const data = res.body.data;
//     expect(typeof data).toBe('object');
//     expect_user_item(data);
//   });

//   const invalid_cases = [
//     {
//       name: 'username_or_email_already_exists',
//       body: {
//         username: exist_username,
//         email: exist_email,
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//     {
//       name: 'username_or_password_mismatch',
//       body: {
//         username: exist_username,
//         email: 'linh1@test.com',
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//     {
//       name: 'email_already_exists',
//       body: {
//         username: 'LinhTest1',
//         email: exist_email,
//       },
//       expected: { code: 'username_or_email_already_exists' },
//     },
//   ];

//   it.each(invalid_cases)('%s', async ({ body, expected }) => {
//     const res = await request(app)
//       .put(`/api/user`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send(body);
//     expect_bad_request(res, expected.code);
//   });
// });

// describe('PUT /api/user/password', () => {
//   afterAll(async () => {
//     await request(app)
//       .put(`/api/user/password`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send({
//         new_password: '123456',
//         old_password: 'new_password',
//       });
//   });

//   it('success', async () => {
//     const res = await request(app)
//       .put(`/api/user/password`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send({
//         old_password: '123456',
//         new_password: 'new_password',
//       });

//     expect_valid_response(res);
//   });

//   const invalid_cases = [
//     {
//       name: 'password_mismatch',
//       body: {
//         old_password: 'wrong_password',
//         new_password: 'new_password',
//       },
//       expected: { code: 'password_mismatch' },
//     },
//   ];

//   it.each(invalid_cases)('%s', async ({ body, expected }) => {
//     const res = await request(app)
//       .put(`/api/user/password`)
//       .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
//       .send(body);
//     expect_bad_request(res, expected.code);
//   });
// });

// function expect_user_item(data: any) {
//   expect(data).toHaveProperty('id');
//   expect(data).toHaveProperty('username');
//   expect(data).toHaveProperty('email');
//   expect(data).toHaveProperty('created_at');
//   expect(data).toHaveProperty('updated_at');

//   expect(typeof data.id).toBe('number');
//   expect(data.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

//   expect_date_data([data.created_at, data.updated_at]);
// }
