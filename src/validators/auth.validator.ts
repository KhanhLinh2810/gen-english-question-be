import { JSONSchemaType } from 'ajv';
import { IUserLogin, IUserRegister } from '../interfaces';

export const loginUserSchema: JSONSchemaType<IUserLogin> = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      nullable: false,
    },
    password: { type: 'string', nullable: false },
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
    },
    email: {
      type: 'string',
      nullable: false,
      format: 'email',
    },
    password: { type: 'string', nullable: false },
  },
  required: ['username', 'email', 'password'],
  additionalProperties: false,
};
