export interface IElasticPhoneticIPADocument {
  word: string;
  cefr: string;
  ipa: string;
  stress: number;
  segement_ipa: string[];
  segement_word: string[];
}
