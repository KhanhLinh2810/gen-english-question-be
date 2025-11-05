export interface IAnswerInExamAttempt {
  question_id: number;
  order: number;
  choice_id?: string;
}

export interface ICreateExamAttempt {
  exam_id: number;
}

export interface ISaveAnswerExamAttempt {
  list_answer: {
    question_id: number;
    choice_id: number;
  }[];
}

export interface IFilterExamAttempt {
  exam_id?: number;
  title?: string;
  user_id?: number;
  username?: string;
}
