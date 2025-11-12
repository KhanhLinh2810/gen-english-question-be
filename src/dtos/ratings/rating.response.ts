import _ from 'lodash';
import { Ratings } from '../../models';
import { UserDTO } from '../users/user.response';


export class RatingDTO {

  public rating_value: number;
  public created_at: Date;
  public updated_at: Date;
  public user_id?: number | null;
  public user?: Omit<UserDTO, 'created_at' | 'updated_at'> | null;

  constructor(rating: Ratings, user?: UserDTO) {
    this.rating_value = rating.rating_value;
    this.created_at = rating.created_at;
    this.updated_at = rating.updated_at;
    this.user_id = rating.user_id;

    const userData = rating.user || user;
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
  }
}