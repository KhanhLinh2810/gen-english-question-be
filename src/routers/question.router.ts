import { Router } from 'express';
import { questionController } from '../controllers/question.controller';
import { validateBody } from '../middleware/validation.middleware';
import { verifyToken } from '../middleware/authenticate.middleware';
import { createQuestionSchema, updateQuestionSchema } from '../validators/question.validator';

const router = Router();

// CRUD
router.get('/user/questions', 
  verifyToken,
  questionController.index.bind(questionController));

router.get('/user/questions/:id', 
  verifyToken,
  questionController.detail.bind(questionController));
  
router.post(
  '/user/questions',
  validateBody(createQuestionSchema),
  verifyToken,
  questionController.create.bind(questionController),
);
router.put(
  '/user/questions/:id',
  validateBody(updateQuestionSchema),
  verifyToken,
  questionController.update.bind(questionController),
);
router.delete('/user/questions/:id', 
  verifyToken,
  questionController.destroy.bind(questionController));

// Import / Generation
// router.post('/user/questions/import-moodle', questionController.importMoodle.bind(questionController));
// router.post('/user/questions/generation', questionController.generate.bind(questionController));

export default router;
