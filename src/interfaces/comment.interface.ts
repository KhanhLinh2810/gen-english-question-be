export interface IFilterComment {
  content?: string;
  user_id?: number;
  question_id?: number;
}

export interface ICreateComment {
  content: string;
  question_id: number;
}

export interface IUpdateComment {
  content: string;
  question_id: number;
}
