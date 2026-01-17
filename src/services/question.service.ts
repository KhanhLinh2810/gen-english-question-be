import _ from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import {
  ICreateAutomaticQuestion,
  ICreateQuestion,
  IFilterQuestion,
  IPagination,
} from '../interfaces';
import { AppError } from '../utility/appError.util';
import axios from 'axios';
import env from '../../env';
import jwt, { SignOptions } from 'jsonwebtoken';
import { QuestionType } from '../enums';
import { Choices, Questions, Users } from '../models';

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

  // create auto
  async createAutomaticQuestion(data: ICreateAutomaticQuestion) {
    const token = this.getToken();
    const { processed_data, url } = this.processedCreatedAutomaticData(data);
    const response = await axios.post(`${url}`, {
      data: processed_data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  }

  // get many
  async getMany(filter: IFilterQuestion, paging: IPagination) {
    const where = this.buildQuery(filter);
    return await Questions.findAndCountAll({
      where,
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
      limit: paging.limit,
      offset: paging.offset,
      order: [[paging.order_by, paging.sort]],
      distinct: true,
    });
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
    if (!question) {
      throw new AppError(BAD_REQUEST, 'question_not_found');
    }
    // Only creator can access (if creator_id is provided and question has a creator)
    // If question has no creator (system question), no one can edit/delete it
    if (creator_id) {
      if (!question.creator_id || question.creator_id !== creator_id) {
        throw new AppError(BAD_REQUEST, 'question_not_found');
      }
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
    this.validateUpdateParams(data);
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
  validateParams(data: ICreateQuestion) {
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

  validateUpdateParams(data: CreationAttributes<Questions>) {
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

    // Simple approach: if both content and tag exist and are the same, search both
    if (filter.content && filter.tag && filter.content === filter.tag) {
      query[Op.or] = [
        { content: { [Op.like]: `%${filter.content}%` } },
        {
          tags: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.like]: `%${filter.tag}%` }],
          },
        },
      ];
    } else {
      // Individual filters
      if (filter.content) {
        query.content = { [Op.like]: `%${filter.content}%` };
      }
      if (filter.tag && !filter.content) {
        // Only apply tag filter if no content filter
        query.tags = {
          [Op.and]: [{ [Op.ne]: null }, { [Op.like]: `%${filter.tag}%` }],
        };
      }
    }

    if (filter.creator_id && filter.is_current_user_only) {
      query.creator_id = filter.creator_id;
    } else {
      query.creator_id = {
        [Op.or]: [filter.creator_id || null, null],
      };
    }

    return query;
  }

  private getToken(): string {
    return jwt.sign(
      {
        id: env.aiServer.id,
      },
      env.aiServer.jwtSecret,
      {
        expiresIn: env.aiServer.jwtExpiredIn,
      } as SignOptions,
    );
  }

  private processedCreatedAutomaticData(data: ICreateAutomaticQuestion) {
    let url = `${env.aiServer.baseUrl}/public`;
    let processed_data = _.omit(data, ['num_question', 'num_ans_per_question']);
    if (
      !(
        data.type in
        [
          QuestionType.PRONUNCIATION,
          QuestionType.STRESS,
          QuestionType.SYNONYM,
          QuestionType.ANTONYM,
          QuestionType.INCORRECT_WORD,
          QuestionType.FILL_IN_BLANK,
          QuestionType.REARRANGE,
        ]
      )
    ) {
      if (!data.description || data.description.length == 0) {
        throw new AppError(BAD_REQUEST, 'description_is_required');
      }
      return {
        processed_data: {
          ...processed_data,
          paragraph: data.description,
        },
        url: url + '/sentence',
      };
    }
    if (!data.list_words || data.list_words.length == 0) {
      return {
        processed_data: {
          ...processed_data,
          list_words: [],
        },
        url,
      };
    }
    const list_words = new Set();

    data.list_words.map((word) => {
      list_words.add(word);
    });
    return {
      processed_data: {
        ...processed_data,
        list_words: Array(list_words),
      },
      url,
    };
  }

  // other
  processCreateListQuestionData(
    questions: ICreateQuestion[],
    creator_id?: number | null,
  ) {
    return questions.map((question) => {
      this.validateParams(question);
      return {
        ...question,
        creator_id: creator_id || null, // Allow null for system questions
      };
    });
  }
}
