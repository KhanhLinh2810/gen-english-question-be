import { Users } from '../../models/users.model';

export class UserDTO {
  public id: number;
  public username: string;
  public email: string;
  public avatar_url?: string | null;

  public created_at: Date;
  public updated_at: Date;

  constructor(user: Users) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.avatar_url = user.avatar_url;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
  }
}
