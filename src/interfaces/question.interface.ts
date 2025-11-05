import { QuestionType } from '../enums';

export interface IFilterQuestion {
  content?: string;
  tag?: string;
  user_id?: number;
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
  explanation: string;
}

export interface IUpdateChoice {
  id?: number;
  content: string;
  is_correct: boolean;
  explanation: string;
}
