export interface ICreateExam {
  title: string;
  duration?: number; // Optional, default 30 minutes
  earliest_start_time: string;
  lastest_start_time?: string | null;
  max_attempt?: number | null;
  note: string;
  list_question: IQuestionInExam[];
  is_public?: boolean; // Optional, default true
}

export interface IQuestionInExam {
  question_id: number;
  score: number;
}

export interface IFilterExam {
  is_current_user_only?: string;
  search?: string; // Combined search for title and username (contains search)
  title?: string;
  duration?: number;
  duration_from?: number;
  duration_to?: number;
  earliest_start_time?: string; // Single datetime for overlap search
  lastest_start_time?: string; // Single datetime for overlap search
  user_id?: number;
  username?: string;
  is_public?: boolean; // Filter by public status (true = only public exams, false = only private exams, undefined = all)
  current_user_id?: number; // Internal field to pass current user ID for filtering public + own exams
}
