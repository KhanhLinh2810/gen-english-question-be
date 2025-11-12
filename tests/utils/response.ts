import { BAD_REQUEST, PERMISSION_ERROR } from '../../src/constants/constants';
import { Response } from 'supertest';

export function expect_bad_request(
  res: Response,
  code: string | string[],
  message?: string | string[],
) {
  expect_invalid_response(res, BAD_REQUEST, code, message);
}

export function expect_permission_error(
  res: Response,
  code: string | string[],
  message?: string | string[],
) {
  expect_invalid_response(res, PERMISSION_ERROR, code, message);
}

function expect_invalid_response(
  res: Response,
  status: number,
  code: string | string[],
  message?: string | string[],
) {
  expect(res.status).toBe(status);
  expect(res.body).toHaveProperty('statusCode', status);
  if (typeof code === 'string') {
    expect(res.body).toHaveProperty('code', code);
    expect(res.body).toHaveProperty('message', message ?? code);
  } else {
    expect(code).toContain(res.body.code);
    expect(message ?? code).toContain(res.body.message ?? code);
  }
}

export function expect_valid_response(res: Response) {
  expect(res.body).toHaveProperty('code', 'SUCCESS');
  expect(res.body).toHaveProperty('message', 'success');
}

export function expect_date_data(data: string[]) {
  for (const item of data) {
    expect(() => new Date(item)).not.toThrow();
  }
}

export function expect_list_data(res: Response) {
  expect_valid_response(res);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('meta');

  expect(Array.isArray(res.body.data)).toBe(true);

  const metadata = res.body.meta;
  expect(metadata).toHaveProperty('total_pages');
  expect(metadata).toHaveProperty('total_items');
  expect(metadata).toHaveProperty('page');
  expect(metadata).toHaveProperty('limit');

  expect(typeof metadata.total_pages).toBe('number');
  expect(typeof metadata.total_items).toBe('number');
  expect(typeof metadata.page).toBe('number');
  expect(typeof metadata.limit).toBe('number');
}
