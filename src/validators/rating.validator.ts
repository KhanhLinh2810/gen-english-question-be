import { JSONSchemaType } from "ajv";
import { ICreateRating, IUpdateRating, IFilterRating } from "../interfaces";

export const createRatingSchema: JSONSchemaType<ICreateRating> = {
  type: "object",
  properties: {
    rating_value: { type: "number", minimum: 1, maximum: 5 },
    question_id: { type: "integer", minimum: 1 },
  },
  required: ["rating_value", "question_id"],
  additionalProperties: false,
};

export const updateRatingSchema: JSONSchemaType<IUpdateRating> = {
  type: "object",
  properties: {
    rating_value: { type: "number", minimum: 1, maximum: 5 },
    question_id: { type: "integer", minimum: 1 },
  },
  required: ["rating_value", "question_id"],
  additionalProperties: false,
};
