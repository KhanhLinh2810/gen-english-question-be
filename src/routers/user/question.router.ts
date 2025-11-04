import { Router } from 'express';
import { questionController } from '../../controllers/question.controller';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createListQuestionSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from '../../validators/question.validator';

const router = Router();

// CRUD
router.get('/', questionController.index.bind(questionController));
router.get('/:id', questionController.detail.bind(questionController));
router.post(
  '/single',
  validateBody(createQuestionSchema),
  questionController.create.bind(questionController),
);
router.post(
  '/',
  validateBody(createListQuestionSchema),
  questionController.createMany.bind(questionController),
);
router.put(
  '/:id',
  validateBody(updateQuestionSchema),
  questionController.update.bind(questionController),
);
router.delete('/:id', questionController.destroy.bind(questionController));

export default router;
