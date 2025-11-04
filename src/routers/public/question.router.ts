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
router.get('/:id', questionController.detail.bind(questionController));
export default router;
