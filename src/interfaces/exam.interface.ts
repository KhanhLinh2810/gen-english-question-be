export interface ICreateExam {
  title: string;
  duration: number;
  earliest_start_time: string;
  lastest_start_time?: string | null;
  max_attempt?: number | null;
  note: string;
  list_question: IQuestionInExam[];
}

export interface IQuestionInExam {
  question_id: number;
  score: number;
}

export interface IFilterExam {
  is_current_user_only?: string;
  title?: string;
  duration?: number;
  earliest_start_time?: string;
  lastest_start_time?: string;
  user_id?: number;
  username?: string;
}
