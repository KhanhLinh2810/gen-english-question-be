export class TimeUtil {
	static monthDiff(dateFrom: Date, dateTo: Date) {
		return (
			new Date(dateTo).getMonth() +
			1 -
			new Date(dateFrom).getMonth() +
			12 *
				(new Date(dateTo).getFullYear() -
					new Date(dateFrom).getFullYear())
		);
	}

	static dayDiff(dateFrom: Date, dateTo: Date) {
		return (
			Math.ceil(
				(new Date(dateTo).getTime() - new Date(dateFrom).getTime()) /
					(1000 * 3600 * 24),
			) + 1
		);
	}
}
