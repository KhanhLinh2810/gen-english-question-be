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
  '/:id/answer',
  validateBody(saveAnswerExamAttemptSchema),
  examAttemptController.saveAnswer.bind(examAttemptController),
);
router.post(
  '/:id/submit',
  validateBody(saveAnswerExamAttemptSchema),
  examAttemptController.submit.bind(examAttemptController),
);

router.get('/', examAttemptController.index.bind(examAttemptController));
router.get(
  '/:id/exams',
  examAttemptController.detailExam.bind(examAttemptController),
);

export default router;
