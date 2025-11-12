import { Router } from 'express';
import { commentController } from '../../controllers/comment.controller';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
} from '../../validators/comment.validator';

const router = Router();

// CRUD
router.get('/', commentController.index.bind(commentController));
router.get('/:id', commentController.detail.bind(commentController));
router.post(
  '/',
  validateBody(createCommentSchema),
  commentController.create.bind(commentController),
);
router.put(
  '/:id',
  validateBody(updateCommentSchema),
  commentController.update.bind(commentController),
);
router.delete('/:id', commentController.destroy.bind(commentController));

export default router;
