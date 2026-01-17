import { QuestionType } from '../enums';

export interface IFilterQuestion {
  is_current_user_only?: boolean;
  content?: string;
  tag?: string;
  creator_id?: number;
}

export interface Creator {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
}

export interface ICreateQuestion {
  content: string;
  description: string;
  score: number;
  type: QuestionType;
  tags: string;
  by_ai: boolean;
  choices: ICreateChoice[];
}

export interface ICreateListQuestion {
  questions: ICreateQuestion[];
}

export interface IUpdateQuestion {
  content: string;
  description: string;
  score: number;
  type: QuestionType;
  tags: string;
  by_ai: boolean;
  choices: IUpdateChoice[];
}

export interface ICreateChoice {
  content: string;
  is_correct: boolean;
  explanation?: string;
}

export interface IUpdateChoice {
  id?: number;
  content: string;
  is_correct: boolean;
  explanation?: string;
}

export interface ICreateAutomaticQuestion {
  list_words?: string[];
  description?: string;
  num_question: number;
  num_ans_per_question: number;
  type: number;
}

export interface IResultAutomaticQuestion {
  content: string;
  type: string;
  by_ai: boolean;
  choices: ICreateChoice;
}

export interface IListResultAutomaticQuestion {
  list_question: IResultAutomaticQuestion[];
}
