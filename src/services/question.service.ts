import _, { words } from 'lodash';
import { CreationAttributes, Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import {
  ICreateAutomaticQuestion,
  ICreateQuestion,
  IElasticPhoneticIPADocument,
  IFilterQuestion,
  IPagination,
} from '../interfaces';
import { Choices } from '../models/choices.model';
import { Questions } from '../models/questions.model';
import { Users } from '../models/users.model';
import { AppError } from '../utility/appError.util';
import { CONTEXT_QUESTION, QuestionType } from '../enums';
import { randomItem } from '../utility/utils';
import { ElasticService } from '../modules';

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
    switch (data.type) {
      case QuestionType.STRESS:
        return await this.createStressQuestion(data);
      case QuestionType.PRONUNCIATION:
        return await this.createPronunciationQuestion(data);
      case QuestionType.SYNONYM:
      // goi toi server kia
      case QuestionType.ANTONYM:
      // goi toi server kia
      case QuestionType.FILL_IN_BLANK:
      // goi toi server kia
      case QuestionType.INCORRECT_WORD:
      // goi toi server kia
      case QuestionType.REARRANGE:
      // goi toi server kia
      case QuestionType.FACT:
      // goi toi server kia
      case QuestionType.MAIN_IDEA:
      // goi toi server kia
      case QuestionType.VOCAB:
      // goi toi server kia
      case QuestionType.INFERENCE:
      // goi toi server kia
      case QuestionType.PURPOSE:
      // goi toi server kia
    }
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
        { model: Choices, as: 'choices', attributes: ['id', 'content'] },
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
      query.content = { [Op.like]: `%${filter.content}%` };
    }
    if (filter.tag) {
      query.tags = { [Op.like]: `%${filter.tag}%` };
    }
    if (filter.user_id) {
      query.creator_id = filter.user_id;
    }
    return query;
  }

  private cal_num_word_in_list_word_per_question(
    list_words: any[],
    num_question: number,
  ) {
    return _.toSafeInteger(list_words.length / num_question);
  }

  private markCharacterInWord(
    wordData: IElasticPhoneticIPADocument,
    targetIPA: string,
    targetChar: string,
  ) {
    let result = '';
    let marked = false;

    for (let i = 0; i < wordData.segement_word.length; i++) {
      const ch = wordData.segement_word[i];

      if (
        !marked &&
        wordData.segement_ipa[i] === targetIPA &&
        ch === targetChar
      ) {
        result += `/${ch}/`;
        marked = true;
      } else {
        result += ch;
      }
    }
    return result;
  }

  private findDifferentIPAIndex(
    word: IElasticPhoneticIPADocument,
    targetIPA: string,
    targetChar: string,
  ) {
    for (let i = word.segement_ipa.length - 1; i >= 0; i--) {
      if (
        word.segement_word[i] === targetChar &&
        word.segement_ipa[i] !== targetIPA
      ) {
        return i;
      }
    }
    return -1;
  }

  getRandomB(a: number): number {
    const r = ((Math.random() * 3) | 0) + 1;
    return r >= a ? r + 1 : r;
  }

  private async createPronunciationQuestion(data: ICreateAutomaticQuestion) {
    const es = ElasticService.getInstance();
    const used_words = new Set<string>();

    // 1. Lấy danh sách word hợp lệ
    let valid_words = await es.getExistingWords(data.list_words);
    if (data.num_question > valid_words.length) {
      const random_fill = await es.getRandomDocuments(
        data.num_question - valid_words.length,
      );

      valid_words = [...valid_words, ...random_fill];
    }
    valid_words.forEach((w) => used_words.add(w.word));

    const result = [];

    for (let i = 0; i < data.num_question; i++) {
      const choices: string[] = [];
      const explanations: string[] = [];

      // 2. Random base word
      const base_word_A = randomItem(valid_words);
      const random_index_A = Math.floor(
        Math.random() * base_word_A.segement_ipa.length,
      );
      const base_char_A = base_word_A.segement_word[random_index_A];
      const base_IPA_A = base_word_A.segement_ipa[random_index_A];

      const markedA = this.markCharacterInWord(
        base_word_A,
        base_IPA_A,
        base_char_A,
      );
      choices.push(markedA);
      explanations.push(base_word_A.ipa);

      // 4. Lấy word B có cùng char nhưng IPA khác
      const diff_IPA_list = await es.searchDifferentIPA(
        base_char_A,
        base_IPA_A,
        1,
        [...used_words],
      );

      if (diff_IPA_list.length === 0) continue;
      const base_word_B = diff_IPA_list[0];
      used_words.add(base_word_B.word);

      const indexB = this.findDifferentIPAIndex(
        base_word_B,
        base_IPA_A,
        base_char_A,
      );
      if (indexB === -1) continue;

      const markedB = this.markCharacterInWord(
        base_word_B,
        base_word_B.segement_ipa[indexB],
        base_word_B.segement_word[indexB],
      );

      choices.push(markedB);
      explanations.push(base_word_B.ipa);

      // 5. Random: word A hoặc B là đáp án đúng
      const isAcorrect = Math.random() < 0.75;

      const targetIPA = isAcorrect
        ? base_IPA_A
        : base_word_B.segement_ipa[indexB];
      const targetChar = isAcorrect
        ? base_char_A
        : base_word_B.segement_word[indexB];

      // 6. Lấy các word distractor có IPA giống (sameIPA)
      const distractors = await es.searchSameIPA(
        targetIPA,
        targetChar,
        data.num_ans_per_question - 2,
        [...used_words],
      );

      for (const word of distractors) {
        const marked = this.markCharacterInWord(word, targetIPA, targetChar);
        choices.push(marked);
        explanations.push(word.ipa);
        used_words.add(word.word);
      }

      // 7. Shuffle đồng bộ
      const zipped = choices.map((c, i) => ({
        choice: c,
        explain: explanations[i],
      }));
      const shuffled = _.shuffle(zipped);

      const answer = isAcorrect ? markedA : markedB;
      const final_choices = shuffled.map((s) => {
        return {
          content: s.choice,
          explanations: s.explain,
          is_correct: s.choice === answer,
        };
      });

      result.push({
        content: CONTEXT_QUESTION.PRONUNCIATION,
        type: QuestionType.PRONUNCIATION,
        description: '',
        score: 4,
        by_ai: true,
        choices: final_choices,
      });
    }

    return result;
  }

  private async createStressQuestion(data: ICreateAutomaticQuestion) {
    const es = ElasticService.getInstance();
    const used_words = new Set<string>();

    // 1. Lấy danh sách word hợp lệ
    let valid_words = await es.getExistingWords(data.list_words, true);
    if (data.num_question > valid_words.length) {
      const extra = await es.getRandomDocuments(
        data.num_question - valid_words.length,
        true,
      );
      valid_words = [...valid_words, ...extra];
    }

    const result = [];

    for (let i = 0; i < data.num_question; i++) {
      const choices: string[] = [];
      const explanations: string[] = [];

      // 2. random từ A
      const base_A = randomItem(valid_words);
      const stress_A = base_A.stress;

      choices.push(base_A.word);
      explanations.push(base_A.ipa);

      // 3. random stress B khác A
      const stress_B = this.getRandomB(stress_A);

      // 4. random xem A có phải đáp án đúng 75%
      const is_A_correct = Math.random() < 0.75;

      let answer = '';

      if (is_A_correct) {
        answer = base_A.word;

        // distractors cùng stress A
        const distractor_A = await es.searchSameStress(
          stress_A,
          data.num_ans_per_question - 2,
          [...used_words],
        );

        distractor_A.forEach((w) => {
          choices.push(w.word);
          explanations.push(w.ipa);
        });

        // 1 từ stress khác (B)
        const word_B = await es.searchSameStress(stress_B, 1, [...used_words]);

        if (!word_B?.length) continue;

        choices.push(word_B[0].word);
        explanations.push(word_B[0].ipa);
      } else {
        // distractors stress B
        const distractor_B = await es.searchSameStress(
          stress_B,
          data.num_ans_per_question - 1,
          [...used_words],
        );

        if (distractor_B.length < data.num_ans_per_question - 1) continue;

        distractor_B.forEach((w) => {
          choices.push(w.word);
          explanations.push(w.ipa);
        });

        // chọn ngẫu nhiên distractor làm đáp án
        const picked = randomItem(distractor_B);
        answer = picked.word;
      }

      // 7. Shuffle đồng bộ
      const zipped = choices.map((c, i) => ({
        choice: c,
        explain: explanations[i],
      }));

      const shuffled = _.shuffle(zipped);

      const final_choices = shuffled.map((s) => ({
        content: s.choice,
        explanations: s.explain,
        is_correct: s.choice === answer,
      }));

      result.push({
        content: CONTEXT_QUESTION.STRESS,
        type: QuestionType.STRESS,
        description: '',
        score: 4,
        by_ai: true,
        choices: final_choices,
      });

      used_words.add(answer);
    }

    return result;
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
