import { JSONSchemaType } from 'ajv';
import { property } from 'lodash';
import { ICreateExamAttempt, ISaveAnswerExamAttempt } from '../interfaces';

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
              nullable: true,
            },
          },
          required: ['question_id'],
          additionalProperties: false,
        },
      },
    },
    required: ['list_answer'],
    additionalProperties: false,
  };
