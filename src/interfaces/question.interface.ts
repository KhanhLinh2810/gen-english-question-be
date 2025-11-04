import { Request } from 'express';
import { QuestionDTO } from '../dtos/questions/question.response';

export interface CustomRequestQuestion extends Request {
  user?: QuestionDTO; // nếu muốn attach user đang thao tác, có thể dùng QuestionDTO hoặc UserDTO
}

// Thông tin filter khi lấy nhiều câu hỏi
export interface IFilterQuestion {
  content?: string;
  tag?: string;
  user_id?: number;
}

// Dữ liệu update câu hỏi
export interface IUpdateQuestion {
  content?: string;
  description?: string;
  score?: number;
  tags?: string;
  choices?: IChoice[];
}

// Dữ liệu tạo câu hỏi
export interface ICreateQuestion {
  content: string;
  description?: string;
  score?: number;
  tags?: string;
  creator_id: number;
  choices?: IChoice[];
}

// Choice cho câu hỏi
export interface IChoice {
  content: string;
  is_correct: boolean;
}
