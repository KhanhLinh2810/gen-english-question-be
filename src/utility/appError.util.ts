// Error object used in error handling middleware function
export class AppError extends Error {
	statusCode: number;
	code: string;
	data?: any;

	constructor(statusCode: number, message: string, code?: string, data?: any) {
		super(message);

		Object.setPrototypeOf(this, new.target.prototype);
		this.name = Error.name;
		this.code = code || message || 'error';
		this.statusCode = statusCode;
		this.data = data;
		Error.captureStackTrace(this);
	}
}
