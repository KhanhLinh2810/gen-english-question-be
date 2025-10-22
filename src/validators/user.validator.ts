import { JSONSchemaType } from 'ajv';
import { IUpdateUser } from '../interfaces';

export const updateUserSchema: JSONSchemaType<IUpdateUser> = {
  type: 'object',
  properties: {
    username: { type: 'string', maxLength: 255 },
    email: {
      type: 'string',
      maxLength: 255,
      format: 'email',
    },
  },
  required: ['username', 'email'],
  additionalProperties: false,
};
