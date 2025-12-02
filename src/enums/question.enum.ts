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
    'Mark the letter A, B, C, or D on your answer sheet to indicate the word whose underlined part differs from the other three in pronunciation in each of the following questions.',
};
