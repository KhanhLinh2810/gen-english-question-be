import { DefinedError, JSONSchemaType } from 'ajv';
import _, { toSafeInteger } from 'lodash';
import { BAD_REQUEST } from '../constants/constants';
import { getField } from '../middleware/validation.middleware';
import { ajv } from '../validators';
import { AppError } from './appError.util';

export const getKeyByValue = <T>(
  object: object,
  value: T,
): string | undefined => {
  return (Object.keys(object) as (keyof typeof object)[]).find((key) => {
    return object[key] == value;
  });
};

interface KeysMap {
  [key: string]: string;
}

export const renameKeysAndPush = (
  keysMap: KeysMap,
  objects: { [key: string]: any }[],
  newItem: { [key: string]: any },
): { [key: string]: any }[] =>
  objects.map((obj) =>
    Object.entries(obj).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Recursively rename keys and add new item to child objects
          return {
            ...acc,
            ...{
              [keysMap[key] || key]: renameKeysAndPush(keysMap, [value], {})[0],
            },
          };
        } else {
          // Rename keys and add new item to non-object properties
          return {
            ...acc,
            ...{ [keysMap[key] || key]: value },
          };
        }
      },
      { ...newItem },
    ),
  );

export const compareArrayUpdateDB = <T extends { id: number }>(
  dataOlds: T[],
  dataNews: T[],
  alwayUpdate = false,
) => {
  const listUpdates: T[] = [];
  const listDeleteIds: number[] = [];
  const listInsert = dataNews.filter((doc) => !doc?.id);
  dataOlds.map((doc) => {
    const data = dataNews.find(
      (newData) => toSafeInteger(newData.id) === doc.id,
    );
    if (!data) {
      listDeleteIds.push(doc.id);
    } else {
      if (alwayUpdate) {
        listUpdates.push({ ...doc, ...data });
      } else {
        let checkUpdate = false;
        for (let key in doc) {
          if (doc[key] !== data[key]) {
            checkUpdate = true;
          }
        }
        if (checkUpdate) {
          listUpdates.push({ ...doc, ...data });
        }
      }
    }
  });
  return { listUpdates, listDeleteIds, listInsert };
};

export function validateByType<T extends string | number | symbol>(
  typeValue: T | undefined,
  validCases: { [key in T]?: () => boolean },
  errorMessage: string,
) {
  if (!typeValue) return;

  const validator = validCases[typeValue];

  if (validator && validator()) {
    throw new AppError(BAD_REQUEST, errorMessage);
  } else if (!validator) {
    throw new AppError(BAD_REQUEST, errorMessage);
  }
}

export function validateFlagWithValue(
  flag: any,
  value: any,
  errorMessage: string,
) {
  if ((flag && !value) || (!flag && value)) {
    throw new AppError(BAD_REQUEST, errorMessage);
  }
}

export function validateObjectType<T>(
  schema: JSONSchemaType<T>,
  params: object,
) {
  const validate = ajv.compile(schema);
  const valid = validate(params);
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
  return [];
}

export function formatToCompareArrayUpdateDB<T extends { id?: number }>(
  data: T[],
) {
  return data.map((item) => ({
    ...item,
    id: _.toSafeInteger(item.id),
  }));
}
