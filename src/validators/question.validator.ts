import { JSONSchemaType } from 'ajv';
import { QuestionType } from '../enums';
import {
  ICreateAutomaticQuestion,
  ICreateChoice,
  ICreateListQuestion,
  ICreateQuestion,
  IUpdateChoice,
  IUpdateQuestion,
} from '../interfaces';

const questionTypeValues = Object.values(QuestionType).filter(
  (v): v is number => typeof v === 'number',
);

// Create Question
const createChoiceSchema: JSONSchemaType<ICreateChoice> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    is_correct: { type: 'boolean' },
    explanation: { type: 'string' },
  },
  required: ['content', 'is_correct', 'explanation'],
  additionalProperties: false,
};
export const createQuestionSchema: JSONSchemaType<ICreateQuestion> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1, maxLength: 512 },
    description: { type: 'string' },
    score: { type: 'number', minimum: 0, maximum: 5 },
    type: { type: 'number', enum: questionTypeValues },
    tags: { type: 'string', default: '[]' },
    by_ai: { type: 'boolean' },
    choices: {
      type: 'array',
      items: createChoiceSchema,
      minItems: 2,
      maxItems: 10,
    },
  },
  required: ['content', 'description', 'score', 'by_ai', 'choices'],
  additionalProperties: false,
};
export const createListQuestionSchema: JSONSchemaType<ICreateListQuestion> = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: createQuestionSchema,
      minItems: 1,
    },
  },
  required: ['questions'],
  additionalProperties: false,
};
export const createAutomaticQuestionSchema: JSONSchemaType<ICreateAutomaticQuestion> =
  {
    type: 'object',
    properties: {
      list_words: {
        type: 'array',
        items: {
          type: 'string',
        },
        maxItems: 20,
      },
      num_question: { type: 'number', minimum: 1, maximum: 10 },
      num_ans_per_question: { type: 'number', minimum: 2, maximum: 10 },
      type: { type: 'number', enum: questionTypeValues },
    },
    required: ['list_words', 'num_question', 'num_ans_per_question', 'type'],
    additionalProperties: false,
  };

// Update Question
const updateChoiceSchema: JSONSchemaType<IUpdateChoice> = {
  type: 'object',
  properties: {
    id: { type: 'integer', nullable: true },
    content: { type: 'string', minLength: 1 },
    is_correct: { type: 'boolean' },
    explanation: { type: 'string' },
  },
  required: ['content', 'is_correct', 'explanation'],
  additionalProperties: false,
};
export const updateQuestionSchema: JSONSchemaType<IUpdateQuestion> = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    score: { type: 'number', minimum: 0, maximum: 5 },
    type: { type: 'number', enum: questionTypeValues },
    tags: { type: 'string' },
    by_ai: { type: 'boolean' },
    choices: {
      type: 'array',
      items: updateChoiceSchema,
      minItems: 2,
      maxItems: 10,
    },
  },
  required: ['content', 'description', 'score', 'by_ai', 'choices'],
  additionalProperties: false,
};
