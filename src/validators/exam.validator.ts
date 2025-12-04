import { JSONSchemaType } from 'ajv';
import { PATTERN } from '../constants/constants';
import { ICreateExam } from '../interfaces';

export const createExamSchema: JSONSchemaType<ICreateExam> = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 100 },
    duration: { type: 'integer', minimum: 1, nullable: true },
    earliest_start_time: {
      type: 'string',
      pattern: PATTERN.DATE_ISO_8601,
    },
    lastest_start_time: {
      type: 'string',
      pattern: PATTERN.DATE_ISO_8601,
      nullable: true,
    },
    max_attempt: { type: 'integer', nullable: true },
    note: { type: 'string' },
    list_question: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_id: { type: 'integer' },
          score: { type: 'integer', minimum: 0 },
        },
        required: ['question_id', 'score'],
      },
      minItems: 1,
      maxItems: 100,
    },
    is_public: { type: 'boolean', nullable: true },
  },
  required: [
    'title',
    'earliest_start_time',
    'note',
    'list_question',
  ],
  additionalProperties: false,
};
