import { Ratings } from '../../models/ratings.model';
import { UserDTO } from '../users';
import { RatingDTO } from './rating.response';

export class ListRatingDTO {
  public ratingDtos: RatingDTO[];

  constructor(ratings: Ratings[], user: UserDTO) {
    this.ratingDtos = ratings.map((rating) => {
      return new RatingDTO(rating, user);
    });
  }
}