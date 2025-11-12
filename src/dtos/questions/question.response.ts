import _ from 'lodash';
import { Creator } from '../../interfaces';
import { Choices, Questions } from '../../models';
import { UserDTO } from '../users/user.response';

export class QuestionDTO {
  public id: number;
  public content: string;
  public description?: string;
  public score: number;
  public type: number;
  public tags?: string;
  public created_at: Date;
  public updated_at: Date;

  public creator_id?: number;
  public creator?: Creator;
  public choices?: ChoiceDTO[];

  constructor(question: Questions, user?: UserDTO) {
    this.id = question.id;
    this.content = question.content;
    this.description = question.description;
    this.score = question.score;
    this.type = question.type;
    this.tags = question.tags ?? undefined;
    this.created_at = question.created_at;
    this.updated_at = question.updated_at;
    this.creator_id = question.creator_id ?? undefined;

    if (question.creator) {
      this.creator = {
        id: question.creator.id,
        username: question.creator.username,
        email: question.creator.email,
        avatar_url: question.creator.avatar_url,
      };
    } else if (user) {
      this.creator = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      };
    }

    this.choices = question.choices
      ? question.choices.map((opt) => new ChoiceDTO(opt))
      : undefined;
  }
}

export class ChoiceDTO {
  public id: number;
  public content: string;
  public is_correct: boolean;
  public explanation?: string;

  constructor(choice: Choices) {
    this.id = choice.id;
    this.content = choice.content;
    this.is_correct = choice.is_correct;
    this.explanation = choice.explanation;
  }
}
