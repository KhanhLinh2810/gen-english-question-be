import { Router } from 'express';
import { examAttemptController } from '../../controllers';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createExamAttemptSchema,
  saveAnswerExamAttemptSchema,
} from '../../validators';

const router = Router();

// CRUD
router.post(
  '/',
  validateBody(createExamAttemptSchema),
  examAttemptController.create.bind(examAttemptController),
);
router.post(
  '/:id/answers',
  validateBody(saveAnswerExamAttemptSchema),
  examAttemptController.saveAnswer.bind(examAttemptController),
);

export default router;
