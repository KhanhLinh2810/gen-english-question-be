import _ from 'lodash';
import { Creator } from '../../interfaces';
import { Choices, Exams, Questions } from '../../models';
import { ChoiceDTO } from '../questions';

interface QuestionItem {
  id: number;
  content: string;
  description?: string;
  score: number;
  score_in_exam: number;
  type: number;
  choices: ChoiceDTO[];
}

export class ExamDTO {
  public id: number;
  public title: string;
  public duration: number;
  public total_question: number;
  public max_attempt?: number;
  public note = '';
  public earliest_start_time: Date;
  public lastest_start_time?: Date;
  public created_at: Date;
  public updated_at: Date;

  public creator_id?: number | undefined;
  public creator?: Creator | undefined;
  public list_question: QuestionItem[] = [];

  constructor(exam: Exams, list_question_db: Questions[]) {
    this.id = exam.id;
    this.title = exam.title;
    this.duration = exam.duration;
    this.total_question = exam.total_question;
    this.max_attempt = exam.max_attempt ?? undefined;
    this.note = exam.note;
    this.earliest_start_time = exam.earliest_start_time;
    this.lastest_start_time = exam.lastest_start_time ?? undefined;
    this.created_at = exam.created_at;
    this.updated_at = exam.updated_at;
    this.creator_id = exam.creator_id ?? undefined;

    this.creator = exam.creator
      ? {
          id: exam.creator.id,
          username: exam.creator.username,
          email: exam.creator.email,
          avatar_url: exam.creator.avatar_url,
        }
      : undefined;

    const map_question_to_score = new Map();
    exam.list_question.map((question) =>
      map_question_to_score.set(question.question_id, question.score),
    );

    for (const questionDb of list_question_db) {
      const choices = questionDb.choices
        ? questionDb.choices.map((opt) => new ChoiceDTO(opt))
        : [];
      this.list_question.push({
        id: questionDb.id,
        content: questionDb.content,
        description: questionDb.description ?? undefined,
        score: questionDb.score,
        score_in_exam: map_question_to_score.get(questionDb.id),
        type: questionDb.type,
        choices,
      });
    }
  }
}
