import { JSONSchemaType } from 'ajv';
import { ICreateExamAttempt, ISaveAnswerExamAttempt } from '../interfaces';
import { property } from 'lodash';

export const createExamAttemptSchema: JSONSchemaType<ICreateExamAttempt> = {
  type: 'object',
  properties: {
    exam_id: {
      type: 'integer',
    },
  },
  required: ['exam_id'],
  additionalProperties: false,
};

export const saveAnswerExamAttemptSchema: JSONSchemaType<ISaveAnswerExamAttempt> =
  {
    type: 'object',
    properties: {
      list_answer: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question_id: {
              type: 'integer',
            },
            choice_id: {
              type: 'integer',
            },
          },
          required: ['question_id', 'choice_id'],
          additionalProperties: false,
        },
      },
    },
    required: ['list_answer'],
    additionalProperties: false,
  };
