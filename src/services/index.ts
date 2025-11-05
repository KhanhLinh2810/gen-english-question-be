import { Op } from 'sequelize';

export { UserService } from './user.service';
export { AuthService } from './auth.service';
export { FileService } from './file.service';
export { CounterService } from './counter.service';
export { EmailService } from './email.service';
export { QuestionService } from './question.service';
export { ExamService } from './exam.service';

export const addFilterDate = (
  searchQuery: any,
  fieldName: string,
  startDate?: Date | null,
  endDate?: Date | null,
) => {
  if (startDate && endDate) {
    searchQuery[fieldName] = {
      [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    };
  } else if (startDate) {
    searchQuery[fieldName] = {
      [Op.gte]: startDate,
    };
  } else if (endDate) {
    searchQuery[fieldName] = {
      [Op.lte]: endDate,
    };
  }
  return searchQuery;
};
