import { JSONSchemaType } from 'ajv';

export const createUserSearchSchema: JSONSchemaType<any> = {
  type: 'object',
  properties: {
    searchTerm: { type: 'object' },
    scope: { type: 'string', maxLength: 100, minLength: 1 },
  },
  required: ['searchTerm', 'scope'],
  additionalProperties: false,
} as any;
