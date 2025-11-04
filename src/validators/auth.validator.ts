import { JSONSchemaType } from 'ajv';
import { IUserLogin, IUserRegister } from '../interfaces';

export const loginUserSchema: JSONSchemaType<IUserLogin> = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      nullable: false,
      maxLength: 255,
    },
    password: { type: 'string', nullable: false, maxLength: 255 },
  },
  required: ['username', 'password'],
  additionalProperties: false,
};

export const registerUserSchema: JSONSchemaType<IUserRegister> = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      nullable: false,
      maxLength: 255,
    },
    email: {
      type: 'string',
      nullable: false,
      format: 'email',
      maxLength: 255,
    },
    password: { type: 'string', nullable: false, maxLength: 255 },
  },
  required: ['username', 'email', 'password'],
  additionalProperties: false,
};
