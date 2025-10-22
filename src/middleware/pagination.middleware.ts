import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST, LIMIT, PAGE } from '../constants/constants';
import { AppError } from '../utility/appError.util';

function isNumeric(str?: string): boolean {
	if (!str) return true;
	return /^\d+$/.test(str);
}

export const pagination = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		if (typeof req.query.page !== 'undefined') {
			if (
				!isNumeric(req.query.page as string) ||
				Number(req.query.page) < 1
			) {
				throw new AppError(BAD_REQUEST, 'wrong_page_params');
			}
		} else {
			req.query.page = PAGE;
		}

		if (typeof req.query.limit !== 'undefined') {
			if (
				!isNumeric(req.query.limit as string) ||
				Number(req.query.limit) < 1
			) {
				throw new AppError(BAD_REQUEST, 'wrong_limit_params');
			}
		} else {
			req.query.limit = LIMIT;
		}
		next();
	} catch (error) {
		next(error);
	}
};
