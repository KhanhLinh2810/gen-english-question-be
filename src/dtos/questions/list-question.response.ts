import { Questions } from '../../models/questions.model';
import { UserDTO } from '../users';
import { QuestionDTO } from './question.response';

export class ListQuestionDTO {
  public questionDtos: QuestionDTO[];

  constructor(questions: Questions[], creator: UserDTO) {
    this.questionDtos = questions.map((question) => {
      return new QuestionDTO(question, creator);
    });
  }
}
