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
        out = `không được có nhiều hơn ${e.params.limit} mục`;
        break;

      case 'additionalProperties':
        out = 'Không được chứa thuộc tính không hợp lệ';
        break;

      case 'anyOf':
        out = 'Giá trị phải khớp với ít nhất một trong các điều kiện "anyOf"';
        break;

      case 'const':
        out = 'Giá trị phải bằng với hằng số cho trước';
        break;

      case 'contains':
        out = 'Danh sách phải chứa một mục hợp lệ';
        break;

      case 'dependencies':
      case 'dependentRequired':
        out = `Khi có thuộc tính "${e.params.property}", phải có thêm ${e.params.deps}`;
        break;

      case 'discriminator':
        switch (e.params.error) {
          case 'tag':
            out = `Tag "${e.params.tag}" phải là chuỗi`;
            break;
          case 'mapping':
            out = `Giá trị của tag "${e.params.tag}" phải thuộc oneOf`;
            break;
          default:
            out = `Không hợp lệ theo từ khóa "${e.keyword}"`;
        }
        break;

      case 'enum':
        out = 'Giá trị phải là một trong các giá trị được định nghĩa trước';
        break;

      case 'false schema':
        out = 'Schema boolean là false, giá trị không hợp lệ';
        break;

      case 'format':
        out = `Giá trị phải đúng theo định dạng "${e.params.format}"`;
        break;

      case 'formatMaximum':
      case 'formatExclusiveMaximum':
        out = `Giá trị phải ${e.params.comparison} ${e.params.limit}`;
        break;

      case 'formatMinimum':
      case 'formatExclusiveMinimum':
        out = `Giá trị phải ${e.params.comparison} ${e.params.limit}`;
        break;

      case 'if':
        out = `Giá trị phải khớp với schema "${e.params.failingKeyword}"`;
        break;

      case 'maximum':
      case 'exclusiveMaximum':
        out = `Giá trị phải ${e.params.comparison} ${e.params.limit}`;
        break;

      case 'maxItems':
        out = `Danh sách không được có hơn ${e.params.limit} mục`;
        break;

      case 'minLength':
      case 'maxLength':
        params = { limit: e.params.limit };
        break;

      case 'maxProperties':
        out = `Không được có hơn ${e.params.limit} thuộc tính`;
        break;

      case 'minimum':
      case 'exclusiveMinimum':
        out = `Giá trị phải ${e.params.comparison} ${e.params.limit}`;
        break;

      case 'minItems':
        out = `Danh sách phải có ít nhất ${e.params.limit} mục`;
        break;

      case 'minProperties':
        out = `Đối tượng phải có ít nhất ${e.params.limit} thuộc tính`;
        break;

      case 'multipleOf':
        out = `Giá trị phải là bội số của ${e.params.multipleOf}`;
        break;

      case 'not':
        out = 'Giá trị không được khớp với schema "not"';
        break;

      case 'oneOf':
        out = 'Giá trị phải khớp duy nhất với một schema trong "oneOf"';
        break;

      case 'pattern':
        out = `Giá trị phải khớp với mẫu "${e.params.pattern}"`;
        break;

      case 'patternRequired':
        out = `Phải có thuộc tính khớp với mẫu "${e.params.missingPattern}"`;
        break;

      case 'propertyNames':
        out = 'Tên thuộc tính không hợp lệ';
        break;

      case 'required':
        out = `Thiếu thuộc tính bắt buộc "${e.params.missingProperty}"`;
        break;

      case 'type':
        out = `Giá trị phải thuộc kiểu "${e.params.type}"`;
        break;

      case 'unevaluatedItems':
        out = `Không được có hơn ${e.params.len} mục chưa được đánh giá`;
        break;

      case 'unevaluatedProperties':
        out = 'Không được có thuộc tính chưa được đánh giá';
        break;

      case 'uniqueItems':
        out = `Danh sách không được chứa mục trùng lặp (vị trí ${e.params.j} và ${e.params.i})`;
        break;

      default:
        out = `Không hợp lệ theo từ khóa "${e.keyword}"`;
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
