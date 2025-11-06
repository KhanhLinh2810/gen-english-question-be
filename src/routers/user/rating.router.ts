import { Router } from 'express';
import { ratingController } from '../../controllers/rating.controller';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createRatingSchema,
  updateRatingSchema,
} from '../../validators/rating.validator';

const router = Router();

router.get('/', ratingController.index.bind(ratingController));
router.get('/:user_id/:question_id', ratingController.detail.bind(ratingController));
router.post(
  '/',
  validateBody(createRatingSchema),
  ratingController.create.bind(ratingController),
);
router.put(
  '/:user_id/:question_id',
  validateBody(updateRatingSchema),
  ratingController.update.bind(ratingController),
);
router.delete('/:question_id', ratingController.destroy.bind(ratingController));
export default router;