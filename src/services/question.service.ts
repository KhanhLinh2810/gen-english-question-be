import { CreationAttributes, Op, Transaction, WhereAttributeHash } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { Questions } from '../models/questions.model';
import { Choices } from '../models/choices.model';
import { Users } from '../models/users.model';
import { AppError } from '../utility/appError.util';
import { IPagination } from '../interfaces';

export interface IFilterQuestion {
  content?: string;
  tag?: string;
  user_id?: number;
}



export class QuestionService {
  private static instance: QuestionService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create 1 question kèm option
  async create(
    data: CreationAttributes<Questions> & { choices?: CreationAttributes<Choices>[] },
    transaction?: Transaction,
  ) {
    const question = await Questions.create(
      {
        ...data,
        choices: data.choices || [],
      },
      { include: [
        { model: Choices, as: 'choices' },
        { model: Users, as: 'creator', attributes: ['id', 'username', 'avatar_url'] },

      ], transaction },
    );
    const fullQuestion = await Questions.findByPk(question.id, {
    include: [
      { model: Users, as: 'creator', attributes: ['id', 'username', 'avatar_url'] },
      { model: Choices, as: 'choices', attributes: ['id', 'content'] },
    ],
    transaction,
  });

  return fullQuestion!;
}

  // create many questions
  async createMany(
    data: (CreationAttributes<Questions> & { choices?: CreationAttributes<Choices>[] })[],
    transaction?: Transaction,
  ) {
    const questions = await Questions.bulkCreate(
      data.map(item => ({
        ...item,
        choices: item.choices || [],
      })),
      { include: [{ model: Choices, as: 'choices' }], transaction },
    );
    return questions;
  }

  // get many
  async getMany(filter: IFilterQuestion, paging: IPagination) {
    const where = this.buildQuery(filter);
    const { rows, count } = await Questions.findAndCountAll({
      where,
      include: [
        { model: Users, as: 'creator', attributes: ['id', 'username', 'avatar_url'] },
        { model: Choices, as: 'choices', attributes: ['id', 'content'] },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });

    return { rows, count };
  }

  async findByPk(id: number, transaction?: Transaction) {
    return await Questions.findByPk(id, { transaction });
  }
  
  //get question by id
  async findOrFailWithAnswer(id: number, transaction?: Transaction) {
    const question = await Questions.findByPk(id, {
      include: [
        { model: Users, as: 'creator', attributes: ['id', 'username', 'avatar_url'] },
        { model: Choices, as: 'choices', attributes: ['id', 'content', 'is_correct'] },
      ],
      transaction,
    });
    if (!question) throw new AppError(BAD_REQUEST, 'question_not_found');
    return question;
  }
  // find or fail
  async findOrFailWithRelations(id: number, transaction?: Transaction) {
    const question = await Questions.findByPk(id, {
      include: [
        { model: Users, as: 'creator', attributes: ['id', 'username', 'avatar_url'] },
        { model: Choices, as: 'choices', attributes: ['id', 'content'] },
      ],
      transaction,
    });
    if (!question) throw new AppError(BAD_REQUEST, 'question_not_found');
    return question;
  }

  // update 
  async update(
    id: number,
    data: CreationAttributes<Questions> & { choices?: CreationAttributes<Choices>[] },
    transaction?: Transaction,
  ) {
    const question = await this.findOrFailWithAnswer(id, transaction);
    await question.update(data, { transaction });

    if (data.choices) {
      // Xoá choices cũ
      await Choices.destroy({ where: { questionId: id }, transaction });
      // Thêm choices mới
      await Choices.bulkCreate(
        data.choices.map(opt => ({ ...opt, questionId: id })),
        { transaction },
      );
    }

    return question;
  }

  // destroy
  async destroy(condition: WhereAttributeHash) {
    return await Questions.destroy({ where: condition });
  }

  // helper: build query
  private buildQuery(filter: IFilterQuestion) {
    const query: any = {};
    if (filter.content) {
      query.content = { [Op.iLike]: `%${filter.content}%` };
    }
    if (filter.tag) {
      query.tags = { [Op.iLike]: `%${filter.tag}%` };
    }
    if (filter.user_id) {
      query.creator_id = filter.user_id;
    }
    return query;
  }
}
