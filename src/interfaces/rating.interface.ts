export interface IFilterRating {
  rating_value?: number;
  user_id?: number;
  question_id?: number;
}

export interface ICreateRating {
  rating_value: number;
  question_id: number;
}

export interface IUpdateRating {
  rating_value: number;
  question_id: number;
}