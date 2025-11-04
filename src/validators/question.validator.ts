import { JSONSchemaType } from 'ajv';
import { ICreateQuestion, IUpdateQuestion, IChoice } from '../interfaces/question.interface';

// Schema cho Choice
const choiceSchema: JSONSchemaType<IChoice> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    is_correct: { type: 'boolean' },
  },
  required: ['content', 'is_correct'],
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
    creator_id: { type: 'integer'},
    choices: {
      type: 'array',
      items: choiceSchema,
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
    choices: {
      type: 'array',
      items: choiceSchema,
      nullable: true,
    },
  },
  required: [],
  additionalProperties: false,
};
