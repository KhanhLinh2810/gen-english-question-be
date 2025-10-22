import { IUser } from '../../interfaces/user.interface';
import { Users } from '../../models/users.model';
import { UserDTO } from './user.response';

export class ListUserDTO {
  public data: IUser[];

  constructor(listUserDb: Users[]) {
    const users: IUser[] = [];

    listUserDb.map((user) => {
      users.push(new UserDTO(user));
    });
    this.data = users;
  }
}
