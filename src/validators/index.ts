import Ajv, { KeywordDefinition } from 'ajv';
import addFormats from 'ajv-formats';
import moment from 'moment';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: true,
  removeAdditional: true,
});
require('ajv-errors')(ajv);

const transformKeyword: KeywordDefinition = {
  keyword: 'transform',
  modifying: true,
  validate(schema: any, data: any, parentSchema?: any, dataCxt?: any): boolean {
    if (schema === 'number' && typeof data === 'string') {
      const num = Number(data);
      if (!isNaN(num)) {
        dataCxt.parentData[dataCxt.parentDataProperty] = num;
        return true;
      }
    }

    if (schema === 'boolean' && typeof data === 'string') {
      if (data === 'true' || data === '1') {
        dataCxt.parentData[dataCxt.parentDataProperty] = true;
        return true;
      } else if (data === 'false' || data === '0') {
        dataCxt.parentData[dataCxt.parentDataProperty] = false;
        return true;
      }
    }

    return true;
  },
};

ajv.addKeyword('transform', transformKeyword);

ajv.addFormat('email', (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
});

ajv.addFormat('emailOrNone', (value) => {
  if (value.length == 0) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
});

const phoneRegex = /^(070|080|090)\d{8}$|^0\d{1,4}\d{1,4}\d{4}$/;
ajv.addFormat('phone', (value) => phoneRegex.test(value));

ajv.addFormat('date', (value: string) => {
  if (value === '') return true;
  const format = 'YYYY-MM-DD';
  const parsedDate = moment(value, format, true);

  return parsedDate.isValid();
});

addFormats(ajv);

export { ajv };
export * from './auth.validator';
export * from './user.validator';
export * from './question.validator';
export * from './exam.validator';
export * from './exam-attempt.validator';
