import { Request } from 'express';
import { UserDTO } from '../dtos';

export interface CustomRequest extends Request {
  user?: UserDTO;
}

export interface IUser {
  id: number;
  username: string | null;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface IFilterUser {
  username?: string;
  email?: string;
}

export interface IUpdateUser {
  username: string;
  email: string;
}

export interface IUpdatePasswordUser {
  old_password: string;
  new_password: string;
}
