import { Questions } from '../../models/questions.model';
import { UserDTO } from '../users/user.response';
import { Options } from '../../models/options.model';

export class QuestionDTO {
  public id: number;
  public content: string;
  public description?: string | null;
  public score: number;
  public tags?: string | null;
  public createdAt: Date;
  public updatedAt: Date;

  public creatorId?: number | null; 
  public creator?: UserDTO | null;
  public options?: OptionDTO[] | null;

  constructor(question: Questions) {
    this.id = question.id;
    this.content = question.content;
    this.description = question.description;
    this.score = question.score;
    this.tags = question.tags;
    this.createdAt = question.createdAt;
    this.updatedAt = question.updatedAt;
    this.creatorId = question.creatorId;

    // Gán thông tin người tạo (nếu include)
    this.creator = question.creator ? new UserDTO(question.creator as any) : null;

    // Gán danh sách options (nếu include)
    this.options = question.options
      ? (question.options as Options[]).map(opt => new OptionDTO(opt))
      : null;
  }
}

export class OptionDTO {
  public id: number;
  public content: string;
  public isCorrect: boolean;

  constructor(option: Options) {
    this.id = option.id;
    this.content = option.content;
    this.isCorrect = option.isCorrect;
  }
}
