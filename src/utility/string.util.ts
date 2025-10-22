import moment from 'moment-timezone';
import env from '../../env';
import { TIMEZONE_DEFAULT } from '../constants/constants';
import { CounterService } from '../services/counter.service';

export const buildHtmlRegisterUser = (encrypted: string) => {
  const generateUrl = `${env.app.base_url}/api/verify?encrypted=${encrypted}`;
  return `<a href="${generateUrl}">${generateUrl}</a>`;
};

export const generateRandomString = (length = 10) =>
  Array.from({ length }, () =>
    '01234567890123456789012345678901234567890123456789012345678901234567890123456789'.charAt(
      Math.floor(Math.random() * 62),
    ),
  ).join('');

export const generateRandomHashCode = (length = 12) =>
  Array.from({ length }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
      Math.floor(Math.random() * 62),
    ),
  ).join('');

export const generateCode = async (
  prefix: string = 'PREFIX',
  numLen: number = 8,
): Promise<string> => {
  const nextSq = await CounterService.getNextSequence(prefix);
  return prefix + nextSq.toString().padStart(numLen, '0');
};

export const padStartZero = (value: any, lenString = 2) => {
  return value.toString().padStart(lenString, '0');
};

export const formatDateOnlyToString = (date: Date | string): string => {
  const [year, month, day] = date.toString().split('-');
  return ` ${year}/${month}/${day}`;
};

export const formatDate = (date: Date): string => {
  return `${date.getFullYear()}${padStartZero(
    date.getMonth() + 1,
  )}${padStartZero(date.getDate())}${padStartZero(
    date.getHours(),
  )}${padStartZero(date.getMinutes())}${padStartZero(date.getSeconds())}`;
};

export const formatDateWithTimezone = (
  date: Date | string | null | undefined,
  timezone?: string,
): string => {
  if (!date) return '';

  const targetTimezone = timezone || TIMEZONE_DEFAULT;

  try {
    const momentDate = moment(date);
    if (!momentDate.isValid()) return '';

    return momentDate.tz(targetTimezone).format('YYYY/MM/DD');
  } catch (error) {
    const fallbackMoment = moment(date);
    return fallbackMoment.isValid() ? fallbackMoment.format('YYYY/MM/DD') : '';
  }
};

export const formatCustomFields = (fields: Record<string, any>) => {
  if (!fields || fields.length === 0) return '';
  return fields
    .map(
      (field: { label: string; value: string }) =>
        `${field.label}: ${field.value}`,
    )
    .join('\n');
};

export const normalizeCSVDataField = (
  data?: string | null | Date,
  isDisplay = false,
  activationFn?: (data: any, ...args: any[]) => string,
  ...fnArgs: any[]
): string => {
  if (isDisplay) {
    if (activationFn && data) {
      return activationFn(data, ...fnArgs);
    }
    return data ? String(data) : '-';
  }
  return '';
};

export function isValidDate(value: string) {
  const date = new Date(value);
  return !isNaN(date.getTime());
}
