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
  options?: IOption[];
}

// Dữ liệu tạo câu hỏi
export interface ICreateQuestion {
  content: string;
  description?: string;
  score?: number;
  tags?: string;
  creatorId: number;
  options?: IOption[];
}

// Option cho câu hỏi
export interface IOption {
  content: string;
  isCorrect: boolean;
}
