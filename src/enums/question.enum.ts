export enum QuestionType {
  PRONUNCIATION = 1, // phien am
  STRESS = 2, // trong am
  SYNONYM = 3, // tu dong nghia
  ANTONYM = 4, // tu trai nghia
  INCORRECT_WORD = 5,
  FILL_IN_BLANK = 6, // dien vao cho trong
  REARRANGE = 7, // sap xep lai cau
  FACT = 21,
  MAIN_IDEA = 22,
  VOCAB = 23,
  INFERENCE = 24,
  PURPOSE = 25,
}

export const QuestionTypeToText: Record<number, string> = {
  [QuestionType.PRONUNCIATION]: 'pronunciation',
  [QuestionType.STRESS]: 'stress',
  [QuestionType.SYNONYM]: 'synonym',
  [QuestionType.ANTONYM]: 'antonym',
  [QuestionType.INCORRECT_WORD]: 'incorrect_word',
  [QuestionType.FILL_IN_BLANK]: 'fill_in_blank',
  [QuestionType.REARRANGE]: 'rearrange',

  [QuestionType.FACT]: 'paragraph_fact',
  [QuestionType.MAIN_IDEA]: 'paragraph_main_idea',
  [QuestionType.VOCAB]: 'paragraph_vocab',
  [QuestionType.INFERENCE]: 'paragraph_inference',
  [QuestionType.PURPOSE]: 'paragraph_purpose',
};
