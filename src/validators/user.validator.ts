import { JSONSchemaType } from 'ajv';
import { IUpdatePasswordUser, IUpdateUser } from '../interfaces';

export const updateUserSchema: JSONSchemaType<IUpdateUser> = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 1, maxLength: 255 },
    email: {
      type: 'string',
      maxLength: 255,
      format: 'email',
    },
  },
  required: ['username', 'email'],
  additionalProperties: false,
};

export const updatePasswordUserSchema: JSONSchemaType<IUpdatePasswordUser> = {
  type: 'object',
  properties: {
    old_password: { type: 'string', minLength: 1, maxLength: 255 },
    new_password: { type: 'string', minLength: 1, maxLength: 255 },
  },
  required: ['old_password', 'new_password'],
  additionalProperties: false,
};
