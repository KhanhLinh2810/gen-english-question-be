import _ from 'lodash';
import { Comments } from '../../models';
import { UserDTO } from '../users/user.response';


export class CommentDTO {
  public id: number;
  public content: string;
  public created_at: Date;
  public updated_at: Date;
  public user_id?: number | null;
  public user?: Omit<UserDTO, 'created_at' | 'updated_at'> | null;

  constructor(comment: Comments, user?: UserDTO) {
    this.id = comment.id;
    this.content = comment.content;
    this.created_at = comment.created_at;
    this.updated_at = comment.updated_at;
    this.user_id = comment.user_id;

    const userData = comment.user || user;
    if (userData) {
      this.user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url,
      };
    } else {
      this.user = null;
    }

    delete (comment as any).createdAt;
    delete (comment as any).updatedAt;
  }
}
