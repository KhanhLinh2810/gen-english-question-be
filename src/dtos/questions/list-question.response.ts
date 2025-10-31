import { QuestionDTO } from './question.response';
import { Questions } from '../../models/questions.model';

export class ListQuestionResponse {
  public code: string;
  public message: string;
  public data: QuestionDTO[];
  public meta: {
    total_pages: number;
    total_items: number;
    page: number;
    limit: number;
  };

  constructor(
    questions: Questions[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.code = 'SUCCESS';
    this.message = 'Fetched questions successfully';
    this.data = questions.map(q => new QuestionDTO(q));
    this.meta = {
      total_pages: Math.ceil(total / limit),
      total_items: total,
      page,
      limit,
    };
  }
}
