import { Questions } from '../../models/questions.model';
import { UserDTO } from '../users/user.response';
import { Choices } from '../../models/choices.model';

export class QuestionDTO {
  public id: number;
  public content: string;
  public description?: string | null;
  public score: number;
  public tags?: string | null;
  public created_at: Date;
  public updated_at: Date;

  public creator_id?: number | null; 
  public creator?: UserDTO | null;
  public choices?: ChoiceDTO[] | null;

  constructor(question: Questions) {
    this.id = question.id;
    this.content = question.content;
    this.description = question.description;
    this.score = question.score;
    this.tags = question.tags;
    this.created_at = question.created_at;
    this.updated_at = question.updated_at;
    this.creator_id = question.creator_id;

    // Gán thông tin người tạo (nếu include)
    this.creator = question.creator ? new UserDTO(question.creator as any) : null;

    // Gán danh sách choices (nếu include)
    this.choices = question.choices
      ? (question.choices as Choices[]).map(opt => new ChoiceDTO(opt))
      : null;
  }
}

export class ChoiceDTO {
  public id: number;
  public content: string;
  public is_correct: boolean;

  constructor(option: Choices) {
    this.id = option.id;
    this.content = option.content;
    this.is_correct = option.is_correct;
  }
}
