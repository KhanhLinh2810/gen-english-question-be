import { UserSearchModel } from '../models/user-search.model';

async function destroy(scope: string, userId: number) {
	return await UserSearchModel.destroy({
		where: { scope: scope as string, userId: userId },
	});
}

export const findOneLatest = async (scope: string, userId: number) => {
	return await UserSearchModel.findOne({
		where: { scope: scope as string, userId: userId },
		order: [['createdAt', 'DESC']],
	});
};

export const UserSearchService = {
	destroy,
	findOneLatest,
};
