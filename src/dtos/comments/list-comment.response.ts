import { Comments } from '../../models/comments.model';
import { UserDTO } from '../users';
import { CommentDTO } from './comment.response';

export class ListCommentDTO {
  public commentDtos: CommentDTO[];

  constructor(comments: Comments[], user: UserDTO) {
    this.commentDtos = comments.map((comment) => {
      return new CommentDTO(comment, user);
    });
  }
}