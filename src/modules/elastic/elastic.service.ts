import { Client } from '@elastic/elasticsearch';
import env from './../../../env';
import { IElasticPhoneticIPADocument } from '../../interfaces';

export class ElasticService {
  private static instance: ElasticService;
  private es: Client;

  private constructor() {
    this.es = new Client({
      node: env.elastic.url.toString(),
      auth: {
        apiKey: env.elastic.api_key.toString(),
      },
    });
  }

  static getInstance(): ElasticService {
    if (!ElasticService.instance) {
      ElasticService.instance = new ElasticService();
    }
    return ElasticService.instance;
  }

  async searchSameIPA(
    char: string,
    ipa: string,
    size = 1,
    excludeWords: string[] = [],
  ) {
    const result = await this.es.search({
      index: 'phonetic_ipa_segement',
      size: size,
      query: {
        function_score: {
          query: {
            bool: {
              must: [
                {
                  script: {
                    script: {
                      lang: 'painless',
                      source: `
                      int doc_segement_word = doc['segement_word'].size();
                      int doc_segement_ipa = doc['segement_ipa'].size();
                      int len = doc_segement_word > doc_segement_ipa ? doc_segement_ipa : doc_segement_word;
                      
                      String charParam = params.char.toString();
                      String ipaParam  = params.ipa.toString();
        
                      for (int i = 0; i < len; i++) {
                        String ch = doc['segement_word'][i];
                        String ip = doc['segement_ipa'][i];

                        if (ch == charParam && ip == ipaParam) {
                          return true;
                        }
                      }

                      return false;
                    `,
                      params: { char, ipa },
                    },
                  },
                },
              ],
              must_not: excludeWords.length
                ? [
                    {
                      terms: {
                        word: excludeWords.map((w) => w.toLowerCase()),
                      },
                    },
                  ]
                : [],
            },
          },
          functions: [{ random_score: { seed: Date.now() } }],
        },
      },
    });

    return result.hits.hits.map(
      (hit: any) => hit._source as IElasticPhoneticIPADocument,
    );
  }

  async searchDifferentIPA(
    char: string,
    ipa: string,
    size = 1,
    excludeWords: string[] = [],
  ) {
    const result = await this.es.search({
      index: 'phonetic_ipa_segement',
      size,
      query: {
        function_score: {
          query: {
            bool: {
              must: [
                {
                  script: {
                    script: {
                      lang: 'painless',
                      source: `
                      int doc_segement_word_size = doc['segement_word'].size();
                      int doc_segement_ipa_size = doc['segement_ipa'].size();

                      int len;
                      if (doc_segement_word_size < doc_segement_ipa_size) {
                        len = doc_segement_word_size;
                      } else {
                        len = doc_segement_ipa_size;
                      }
                      
                      String charParam = params.char.toString();
                      String ipaParam  = params.ipa.toString();
        
                      for (int i = 0; i < len; i++) {
                        String ch = doc['segement_word'][i];
                        String ip = doc['segement_ipa'][i];

                        if (ch.equals(charParam) && !ip.equals(ipaParam)) {
                          return true;
                        }
                      }

                      return false;
                    `,
                      params: { char, ipa },
                    },
                  },
                },
              ],
              must_not: excludeWords.length
                ? [
                    {
                      terms: {
                        word: excludeWords.map((w) => w.toLowerCase()),
                      },
                    },
                  ]
                : [],
            },
          },
          functions: [
            {
              random_score: {
                field: '_seq_no', // ổn định, không bị script error
                seed: Date.now(),
              },
            },
          ],
        },
      },
    });

    return result.hits.hits.map(
      (h: any) => h._source as IElasticPhoneticIPADocument,
    );
  }

  async searchSameStress(
    same_stress: number,
    size: number,
    used_words: string[] = [],
  ) {
    const mustNot = used_words.length
      ? [
          {
            terms: {
              word: used_words,
            },
          },
        ]
      : [];

    const result = await this.es.search({
      index: 'phonetic_ipa_segement',
      size,
      query: {
        function_score: {
          query: {
            bool: {
              must: [
                { term: { stress: same_stress } },
                {
                  range: {
                    num_syllables: {
                      gte: 2,
                      lte: 5,
                    },
                  },
                },
              ],
              must_not: mustNot,
            },
          },
          functions: [
            {
              random_score: {
                seed: Date.now(),
              },
            },
          ],
        },
      },
    });

    return result.hits.hits.map((h) => {
      const src = h._source as any;
      return {
        word: src.word,
        ipa: src.ipa,
        stress: src.stress,
        num_syllables: src.num_syllables,
      };
    });
  }

  async getListWordInfo(word: string): Promise<IElasticPhoneticIPADocument[]> {
    if (!word) return [];

    const raw_data = await this.es.search({
      index: 'phonetic_ipa_segement',
      size: 100,
      query: {
        term: {
          word: {
            value: word,
          },
        },
      },
    });
    return raw_data.hits.hits.map(
      (hit) => hit._source as IElasticPhoneticIPADocument,
    );
  }

  async getExistingWords(
    words: string[],
    is_word_for_stress = false,
  ): Promise<IElasticPhoneticIPADocument[]> {
    if (!words.length) return [];

    const uniqueWords = Array.from(new Set(words.map((w) => w.toLowerCase())));

    const mustQueries: any[] = [{ terms: { word: uniqueWords } }];
    if (is_word_for_stress !== undefined) {
      mustQueries.push({
        range: {
          num_syllables: {
            gte: 2,
            lte: 4,
          },
        },
      });
    }
    const rawData = await this.es.search({
      index: 'phonetic_ipa_segement',
      size: uniqueWords.length,
      query: {
        bool: { must: mustQueries },
      },
    });

    return rawData.hits.hits.map(
      (hit) => hit._source as IElasticPhoneticIPADocument,
    );
  }

  async getRandomDocuments(
    count: number,
    is_word_for_stress = false,
  ): Promise<IElasticPhoneticIPADocument[]> {
    const result = await this.es.search({
      index: 'phonetic_ipa_segement',
      size: count,
      query: {
        function_score: {
          query: {
            bool: {
              must: is_word_for_stress
                ? {
                    range: {
                      num_syllables: {
                        gte: 2,
                        lte: 4,
                      },
                    },
                  }
                : { match_all: {} },
            },
          },
          functions: [
            {
              random_score: {
                seed: Date.now(),
              },
            },
          ],
        },
      },
    });
    return result.hits.hits.map(
      (h) => h._source as IElasticPhoneticIPADocument,
    );
  }
}
