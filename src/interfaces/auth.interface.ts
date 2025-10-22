export interface ITokenPayload {
  id?: number;
  expires?: number;
  iat?: number;
  exp?: number;
}

export interface IUserLogin {
  username: string;
  password: string;
}

export interface IUserRegister {
  username: string;
  email: string;
  password: string;
}
