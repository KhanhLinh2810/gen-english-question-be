import { Router } from 'express';
import { questionController } from '../../controllers/question.controller';

const router = Router();

// CRUD
router.get('/:id', questionController.detail.bind(questionController));
export default router;
