//HTTP
const RESPONSE_SUCCESS = 200;
const SYSTEM_ERROR = 500;
const CONFLICT_ERROR = 409;
const PERMISSION_ERROR = 401; //not enough authorization
const SESSION_ERROR = 403; //no-session
const NOROUTE_ERROR = 404; //no-route
const NOT_ACCEPTABLE = 406; //not acceptable
const BAD_REQUEST = 400; //bad request

const PAGE = '1';
const LIMIT = '10';

const REGEX_NUMBER = new RegExp(/^\d+$/);

const REGEX_EMAIL = new RegExp(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
);

const CUSTOMER_CODE_PREFIX = 'HW';

const CUSTOMER_CODE_NUM_LEN = 9;

const TIMEZONE_DEFAULT = 'Asia/Tokyo';

const PATTERN = {
  DECIMAL: '^[0-9]+(\\.[0-9]{1,2})?$',
  AMOUNT: '^(0|[1-9][0-9]*)$',
  DATE: '^\\d{4}-\\d{2}-\\d{2}$',
  ZIP_CODE: '^[0-9]{3}-[0-9]{4}$|^[0-9]{7}$',
};

const CURRENCY_DEFAULT = 'JPY';

const MESS_ERROR_PAYMENT = {
  MAX_AMOUNT_OF_PLAN: () =>
    `${MAX_AMOUNT_PAYMENT.string}円以下のプランのみは決済可能です。`,
};

const MAX_AMOUNT_PAYMENT = {
  number: 99999999,
  string: '99,999,999',
};

export {
  CONFLICT_ERROR,
  PERMISSION_ERROR,
  RESPONSE_SUCCESS,
  SYSTEM_ERROR,
  SESSION_ERROR,
  NOROUTE_ERROR,
  NOT_ACCEPTABLE,
  BAD_REQUEST,
  PAGE,
  LIMIT,
  REGEX_NUMBER,
  REGEX_EMAIL,
  CUSTOMER_CODE_PREFIX,
  CUSTOMER_CODE_NUM_LEN,
  TIMEZONE_DEFAULT,
  PATTERN,
  CURRENCY_DEFAULT,
  MESS_ERROR_PAYMENT,
  MAX_AMOUNT_PAYMENT,
};
