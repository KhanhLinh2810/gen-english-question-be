export enum QuestionType {
  PRONUNCIATION = 1, // phien am
  STRESS = 2, // trong am
  SYNONYM = 3, // tu dong nghia
  ANTONYM = 4, // tu trai nghia
  INCORRECT_WORD = 5,
  FILL_IN_BLANK = 6, // dien vao cho trong
  REARRANGE = 7, // sap xep lai cau
}

export const CONTEXT_QUESTION = {
  PRONUNCIATION:
    'Choose the option whose underlined part is pronounced differently from the others.',

  STRESS:
    'Choose the word whose primary stress is placed differently from the others.',
};
