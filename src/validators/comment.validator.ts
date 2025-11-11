import { JSONSchemaType } from "ajv";
import { ICreateComment, IUpdateComment, IFilterComment } from "../interfaces";

export const createCommentSchema: JSONSchemaType<ICreateComment> = {
  type: "object",
  properties: {
    content: { type: "string", minLength: 1 },
    question_id: { type: "integer", minimum: 1 },
  },
  required: ["content", "question_id"],
  additionalProperties: false,
};

export const updateCommentSchema: JSONSchemaType<IUpdateComment> = {
  type: "object",
  properties: {
    content: { type: "string", minLength: 1 },
    question_id: { type: "integer", minimum: 1 },
  },
  required: ["content", "question_id"],
  additionalProperties: false,
};

export const filterCommentSchema: JSONSchemaType<IFilterComment> = {
  type: "object",
  properties: {
    content: { type: "string", minLength: 1, nullable: true },
    user_id: { type: "integer", minimum: 1, nullable: true },
    question_id: { type: "integer", minimum: 1, nullable: true },
    },
  required: [],
  additionalProperties: false,
};
