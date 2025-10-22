import { DefinedError, ErrorObject, JSONSchemaType } from 'ajv';
import * as express from 'express';
import { BAD_REQUEST, SYSTEM_ERROR } from '../constants/constants';
import { AppError } from '../utility/appError.util';
import { ajv } from '../validators';

export function getField(schemaPath: string, params: any): string {
  if (params.additionalProperty) {
    return params.additionalProperty;
  } else if (params.missingProperty) {
    return params.missingProperty;
  } else if (params.errors) {
    const err = params.errors[0] as DefinedError;
    return getField(err.schemaPath, err.params);
  }
  const startIndex = schemaPath.indexOf('/properties/') + '/properties/'.length;
  const endIndex = schemaPath.indexOf('/', startIndex);

  return schemaPath.slice(startIndex, endIndex);
}

export function validateBody<T>(schema: JSONSchemaType<T>) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const validate = ajv.compile(schema);
      const valid = validate(req.body);
      if (!valid) {
        const doc: { message: string; field: string }[] = [];
        translateErrorMessages(validate.errors, res.__);
        for (const err of validate.errors as DefinedError[]) {
          doc.push({
            message: res.__(err.message || 'Input error'),
            field: getField(err.schemaPath, err.params),
          });
        }

        res.status(BAD_REQUEST).json({ error: doc });
      } else {
        next();
      }
    } catch (error: unknown) {
      const message = (error as Error).message;
      next(new AppError(SYSTEM_ERROR, message));
    }
  };
}

export function validateParamOfFunction<T>(
  param: T,
  schema: JSONSchemaType<T>,
) {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(param);
    if (!valid) {
      const doc: { message: string; field: string }[] = [];
      for (const err of validate.errors as DefinedError[]) {
        doc.push({
          message: err.message || 'Input error',
          field: getField(err.schemaPath, err.params),
        });
      }

      return doc;
    }
  } catch (error: unknown) {
    const message = (error as Error).message;
    throw new Error(message);
  }
}

export function translateErrorMessages(
  errors?: ErrorObject[] | null,
  t?: i18nAPI['__'],
) {
  if (!t) t = i18n.__;
  if (!(errors && errors.length)) return;
  for (const e of errors) {
    if (e.keyword === 'errorMessage') continue;
    let out;
    let params: { [key: string]: any } = {};
    switch (e.keyword) {
      case 'additionalItems':
      case 'items':
        out = '';
        var n = e.params.limit;
        out += 'は' + n + '以上あってはいけない';
        break;
      case 'additionalProperties':
        out = '追加してはいけない';
        break;
      case 'anyOf':
        out = '"anyOf"のスキーマとマッチしなくてはいけない';
        break;
      case 'const':
        out = 'must be equal to constant';
        break;
      case 'contains':
        out = 'must contain a valid item';
        break;
      case 'dependencies':
      case 'dependentRequired':
        out = '' + e.params.property + 'がある場合、';
        var n = e.params.depsCount;
        out += 'は' + e.params.deps + 'をつけなければいけない';
        break;
      case 'discriminator':
        switch (e.params.error) {
          case 'tag':
            out = 'tag "' + e.params.tag + '" must be string';
            break;
          case 'mapping':
            out = 'value of tag "' + e.params.tag + '" must be in oneOf';
            break;
          default:
            out = 'must pass "' + e.keyword + '" keyword validation';
        }
        break;
      case 'enum':
        out = '事前に定義された値のいずれかに等しくなければいけない';
        break;
      case 'false schema':
        out = 'boolean schema is false';
        break;
      case 'format':
        out = '"' + e.params.format + '"形式に揃えなければいけない';
        break;
      case 'formatMaximum':
      case 'formatExclusiveMaximum':
        out = '';
        var cond = e.params.comparison + ' ' + e.params.limit;
        out += 'must be ' + cond;
        break;
      case 'formatMinimum':
      case 'formatExclusiveMinimum':
        out = '';
        var cond = e.params.comparison + ' ' + e.params.limit;
        out += 'must be ' + cond;
        break;
      case 'if':
        out = 'must match "' + e.params.failingKeyword + '" schema';
        break;
      case 'maximum':
      case 'exclusiveMaximum':
        out = '';
        var cond = e.params.comparison + ' ' + e.params.limit;
        out += cond + 'でなければいけない';
        break;
      case 'maxItems':
        out = '';
        var n = e.params.limit;
        out += 'は' + n + '個以上であってはいけない';
        break;
      case 'minLength':

      case 'maxLength':
        params = { limit: e.params.limit };
        break;
      case 'maxProperties':
        out = '';
        var n = e.params.limit;
        out += 'は' + n + '個以上のプロパティを有してはいけない';
        break;
      case 'minimum':
      case 'exclusiveMinimum':
        out = '';
        var cond = e.params.comparison + ' ' + e.params.limit;
        out += cond + 'でなければいけない';
        break;
      case 'minItems':
        out = '';
        var n = e.params.limit;
        out += 'は' + n + '個以下であってはいけない';
        break;
      case 'minProperties':
        out = '';
        var n = e.params.limit;
        out += 'は' + n + '個以下のプロパティを有してはいけない';
        break;
      case 'multipleOf':
        out = '' + e.params.multipleOf + 'の倍数でなければいけない';
        break;
      case 'not':
        out = '"not"のスキーマに従って有効としてはいけない';
        break;
      case 'oneOf':
        out = '"oneOf"のスキーマと完全に一致しなくてはいけない';
        break;
      case 'pattern':
        out = '"' + e.params.pattern + '"のパターンと一致しなければいけない';
        break;
      case 'patternRequired':
        out =
          'must have property matching pattern "' +
          e.params.missingPattern +
          '"';
        break;
      case 'propertyNames':
        out = 'property name is invalid';
        break;
      case 'required':
        out =
          '必要なプロパティ' + e.params.missingProperty + 'がなければいけない';
        break;
      case 'type':
        out = '' + e.params.type + 'でなければいけない';
        break;
      case 'unevaluatedItems':
        out = '';
        var n = e.params.len;
        out += 'must NOT have more than ' + n + ' item';
        if (n != 1) {
          out += 's';
        }
        break;
      case 'unevaluatedProperties':
        out = 'must NOT have unevaluated properties';
        break;
      case 'uniqueItems':
        out =
          '重複するアイテムがあってはいけない（' +
          e.params.j +
          'と' +
          e.params.i +
          'は同じである）';
        break;
      default:
        out = 'must pass "' + e.keyword + '" keyword validation';
    }
    e.message = out || t('validation.' + e.keyword, params);
  }
}

export function validateParams<T>(schema: JSONSchemaType<T>) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const validate = ajv.compile(schema);
      const valid = validate(req.params);
      if (!valid) {
        translateErrorMessages(validate.errors, res.__);
        const messages = validate.errors;
        return res.status(BAD_REQUEST).json(messages);
      }
      next();
    } catch (error: unknown) {
      const message = (error as Error).message;
      next(new AppError(SYSTEM_ERROR, message));
    }
  };
}
