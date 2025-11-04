import { Request } from 'express';
import _ from 'lodash';
import moment from 'moment';
import env from '../../env';

export function paginate(
	req: Request,
	sortBy = 'created_at',
	sortOrder: 'asc' | 'desc' = 'desc',
): {
	page: number;
	limit: number;
	offset: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
} {
	const page = _.toSafeInteger(req.query.page) || 1;
	const limit = _.toSafeInteger(req.query.limit) || 10;
	return {
		page,
		limit,
		offset: (page - 1) * limit,
		sortBy: (req.query.order_by as string) || sortBy,
		sortOrder: req.query.sort == 'asc' ? 'asc' : sortOrder,
	};
}

export function toSafeBoolean(value: any): boolean {
	return value === 'true' || value === true;
}

export function toSafeArray<T = any>(value: any): T[] {
	return _.isArray(value) ? value : [];
}

export function toSafeString(value: any): string {
	if (value == null || value == undefined) return '';
	return value.toString();
}

export function parseSafeDate(value: any): Date | undefined | null {
	if (_.isNil(value)) return value;
	let date: moment.Moment;
	if ((date = moment(value)).isValid()) {
		return date.toDate();
	}
}

export function parseSafeNumber(value: any): number | undefined | null {
	return _.isNil(value) ? value : _.toSafeInteger(value);
}

export function nullifyEmptyString(value: any): string | null {
	return _.isEmpty(value) ? null : value;
}

export function resolveUploadURL(path: string): string {
	return new URL(path, env.app.base_url).href;
}

// fix issue https://github.com/expressjs/multer/issues/1104
export function getCorrectEncoding(str: string) {
	return Buffer.from(str, 'latin1').toString('utf-8');
}

export function trimString<T>(value: T): T {
	if (_.isString(value)) {
		return value.trim() as T;
	}
	return value;
}

export function escapeForILike(value: string): string {
	return value.replace(/%/g, '\\%');
}

export const escapeSearchKeyword = (keyword: string): string => {
	return keyword
	  .replace(/\\/g, '\\\\')
	  .replace(/%/g, '\\%')
	  .replace(/_/g, '\\_');
  };