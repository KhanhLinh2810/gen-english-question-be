import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { ICreateQuestion, IFilterQuestion, IPagination } from '../interfaces';
import { Choices } from '../models/choices.model';
import { Questions } from '../models/questions.model';
import { Users } from '../models/users.model';
import { AppError } from '../utility/appError.util';

export class QuestionService {
  private static instance: QuestionService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  // create
  async create(data: CreationAttributes<Questions>, transaction?: Transaction) {
    return await Questions.create(data, {
      include: [{ model: Choices, as: 'choices' }],
      transaction,
    });
  }

  async createMany(
    data: CreationAttributes<Questions>[],
    transaction?: Transaction,
  ) {
    return await Questions.bulkCreate(data, {
      include: [{ model: Choices, as: 'choices' }],
      transaction,
    });
  }

  // get many
  async getMany(filter: IFilterQuestion, paging: IPagination) {
    const where = this.buildQuery(filter);
    const { rows, count } = await Questions.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
        { model: Choices, as: 'choices', attributes: ['id', 'content'] },
      ],
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });

    return { rows, count };
  }

  // get one
  async findByPk(id: number, transaction?: Transaction) {
    return await Questions.findByPk(id, { transaction });
  }

  // find or fail
  async findOrFailWithRelations(
    id: number,
    creator_id?: number,
    transaction?: Transaction,
  ) {
    const question = await Questions.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url'],
        },
        {
          model: Choices,
          as: 'choices',
          attributes: ['id', 'content', 'is_correct', 'explanation'],
        },
      ],
      transaction,
    });
    if (!question || (creator_id && question.creator_id !== creator_id)) {
      throw new AppError(BAD_REQUEST, 'question_not_found');
    }
    return question;
  }

  // update
  async update(
    id: number,
    data: CreationAttributes<Questions>,
    creator_id: number,
    transaction: Transaction,
  ) {
    this.validateParams(data);
    const question = await this.findOrFailWithRelations(id, creator_id);
    await question.update(data, { transaction });

    const choices = await this.updateChoice(
      id,
      question.choices,
      data.choices,
      transaction,
    );
    question.choices = choices;

    return question;
  }

  private async updateChoice(
    questionId: number,
    listChoiceDb: Choices[],
    listChoiceNew: CreationAttributes<Choices>[],
    transaction: Transaction,
  ) {
    const result: Choices[] = [];

    const listCreateChoiceData: CreationAttributes<Choices>[] = [];
    const listDeleteChoiceId: number[] = [];
    const listUpdateChoiceData = new Map();

    // in list new data, choice have id will be updated, choice have not id will be created
    for (const choiceNew of listChoiceNew) {
      if (choiceNew.id) {
        listUpdateChoiceData.set(choiceNew.id, _.omit(choiceNew, ['id']));
      } else {
        listCreateChoiceData.push({
          ...choiceNew,
          questionId,
        });
      }
    }

    // in list db data, choice have id in list updated data will be updated, choice have not id in list updated data will be deleted
    for (const choiceDb of listChoiceDb) {
      const updateData = listUpdateChoiceData.get(choiceDb.id);
      if (!updateData) {
        listDeleteChoiceId.push(choiceDb.id);
        continue;
      }

      choiceDb.set(updateData);
      await choiceDb.save({ transaction });

      result.push(choiceDb);
    }

    if (listDeleteChoiceId.length > 0) {
      await Choices.destroy({
        where: { id: { [Op.in]: listDeleteChoiceId } },
        transaction,
      });
    }

    if (listCreateChoiceData) {
      const newChoices = await Choices.bulkCreate(listCreateChoiceData, {
        transaction,
      });
      result.push(...newChoices);
    }
    return result;
  }

  // destroy
  async destroy(id: number) {
    return await Questions.destroy({ where: { id: id } });
  }

  // validate
  validateParams(data: CreationAttributes<Questions>) {
    let count_correct_choice = 0;
    data.choices.map((choice) => {
      if (choice.is_correct == true) count_correct_choice++;
    });
    if (!count_correct_choice)
      throw new AppError(
        BAD_REQUEST,
        'question_must_have_at_least_one_correct_answer',
      );
  }

  // helper
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

  // other
  processCreateListQuestionData(
    questions: ICreateQuestion[],
    creator_id: number,
  ) {
    return questions.map((question) => {
      this.validateParams(question);
      return {
        ...question,
        creator_id,
      };
    });
  }
}
