import { STATUS_CODES } from 'http';
import { PERMISSION_ERROR } from './constants';

export default {
	USER: {},
	CUSTOMER: {
		OPTION_SHOW: {
			LOGO: 1,
			SLOGAN: 2,
		},
	},
	REPAIR: {
		STATUS: {
			NOT_YET_SEND: 1,
			NOT_YET_READ: 2,
			WAITING_AGREEMENT: 3,
			NOT_YET_REPAIRED: 4,
			IN_REPAIR: 5,
			REPAIR_COMPLETED: 6,
			EXPIRED: 7,
			CUSTOMER_CONFIRMED: 8,
		},
	},
	REPAIR_DOCUMENT: {
		STATUS: {
			PENDING: 1,
			CONFIRMED: 2,
			REJECTED: 3,
			NOT_YET_READ: 4,
		},
	},
	REPAIR_IMAGE: {
		TYPE: {
			FRONT: 1,
			BACK: 2,
			RIGHT: 3,
			LEFT: 4,
			OTHER: 5,
		},
	},
	SUBMIT_AGREEMENT: {
		STATUS: {
			NOT_SEND: 1,
			SENT: 2,
			SOME_NOT_SEND: 3,
		},
	},
	SENT_AGREEMENT: {
		STATUS: {
			NOT_YET_READ: 1,
			READ: 2,
		},
	},
	PERMISSION: {
		SUBMIT_AGREEMENT_MANAGEMENT: {
			SUBMIT_AGREEMENT_LIST: 'submit_agreement_list',
			SUBMIT_AGREEMENT_CREATE: 'submit_agreement_create',
			SUBMIT_AGREEMENT_DETAIL: 'submit_agreement_detail',
			SUBMIT_AGREEMENT_EDIT: 'submit_agreement_edit',
			SUBMIT_AGREEMENT_DELETE: 'submit_agreement_delete',
			SUBMIT_AGREEMENT_SEARCH_LIST: 'submit_agreement_search_list',
		},
		CLIENT_MANAGEMENT: {
			CLIENT_LIST: 'client_list',
			CLIENT_CREATE: 'client_create',
			CLIENT_DETAIL: 'client_detail',
			CLIENT_EDIT: 'client_edit',
			CLIENT_DELETE: 'client_delete',
			CLIENT_SEARCH_LIST: 'client_search_list',
		},
		CUSTOMER_MANAGEMENT: {
			CUSTOMER_LIST: 'customer_list',
			CUSTOMER_CREATE: 'customer_create',
			CUSTOMER_DETAIL: 'customer_detail',
			CUSTOMER_EDIT: 'customer_edit',
			CUSTOMER_DELETE: 'customer_delete',
			CUSTOMER_SEARCH_LIST: 'customer_search_list',
		},
		REPAIR_MANAGEMENT: {
			REPAIR_LIST: 'repair_list',
			REPAIR_CREATE: 'repair_create',
			REPAIR_DETAIL: 'repair_detail',
			REPAIR_EDIT: 'repair_edit',
			REPAIR_DELETE: 'repair_delete',
		},
		ACCOUNT_MANAGEMENT: {
			ACCOUNT_LIST: 'account_list',
			ACCOUNT_CREATE: 'account_create',
			ACCOUNT_DETAIL: 'account_detail',
			ACCOUNT_EDIT: 'account_edit',
			ACCOUNT_DELETE: 'account_delete',
		},
		PERMISSION_MANAGEMENT: {
			PERMISSION_LIST: 'permission_list',
			PERMISSION_CREATE: 'permission_create',
			PERMISSION_DETAIL: 'permission_detail',
			PERMISSION_EDIT: 'permission_edit',
			PERMISSION_DELETE: 'permission_delete',
		},
		SETTING: {
			ENABLING_REPAIR_AGREEMENT_LINK: 'enabling_repair_agreement_link',
		},
		MAKER_MANAGEMENT: {
			MAKER_LIST: 'maker_list',
			MAKER_CREATE: 'maker_create',
			MAKER_EDIT: 'maker_edit',
			MAKER_DELETE: 'maker_delete',
		},
		MODEL_MANAGEMENT: {
			MODEL_LIST: 'model_list',
			MODEL_CREATE: 'model_create',
			MODEL_EDIT: 'model_edit',
			MODEL_DELETE: 'model_delete',
		},
		CATEGORY_MANAGEMENT: {
			CATEGORY_LIST: 'category_list',
			CATEGORY_CREATE: 'category_create',
			CATEGORY_EDIT: 'category_edit',
			CATEGORY_DELETE: 'category_delete',
		},
	},
};
