// import { faker } from '@faker-js/faker';
// import { CreationAttributes } from 'sequelize';
// import { QuestionType } from 'src/enums';
// import { Questions } from 'src/models';

// function fakeCreateQuestion(): CreationAttributes<Questions> {
//   return {
//     content: faker.lorem.sentence(),
//     description: faker.lorem.paragraph(),
//     score: faker.number.int({ min: 0, max: 10 }),
//     type: faker.helpers.arrayElement(
//       Object.values(QuestionType),
//     ) as QuestionType,
//     tags: faker.helpers
//       .arrayElements(['ai', 'math', 'english', 'science'])
//       .join(','),
//   };
// }
