import { JSONSchemaType } from 'ajv';
import { ICreateQuestion, IUpdateQuestion, IOption } from '../interfaces/question.interface';

// Schema cho Option
const optionSchema: JSONSchemaType<IOption> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    isCorrect: { type: 'boolean' },
  },
  required: ['content', 'isCorrect'],
  additionalProperties: false,
};

// Create Question
export const createQuestionSchema: JSONSchemaType<ICreateQuestion> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    description: { type: 'string', nullable: true },
    score: { type: 'integer', nullable: true, minimum: 0 },
    tags: { type: 'string', nullable: true },
    creatorId: { type: 'integer'},
    options: {
      type: 'array',
      items: optionSchema,
      nullable: true,
    },
  },
  required: ['content'],
  additionalProperties: false,
};

// Update Question
export const updateQuestionSchema: JSONSchemaType<IUpdateQuestion> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1, nullable: true },
    description: { type: 'string', nullable: true },
    score: { type: 'integer', nullable: true, minimum: 0 },
    tags: { type: 'string', nullable: true },
    options: {
      type: 'array',
      items: optionSchema,
      nullable: true,
    },
  },
  required: [],
  additionalProperties: false,
};
