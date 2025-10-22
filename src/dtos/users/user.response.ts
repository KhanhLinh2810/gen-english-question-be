import { Users } from '../../models/users.model';

export class UserDTO {
  public id: number;
  public username: string | null;
  public email: string;
  public avatar_url?: string | null;

  public createdAt: Date;
  public updatedAt: Date;

  constructor(user: Users) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.avatar_url = user.avatar_url;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
