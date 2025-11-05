import { Router } from 'express';
import examRouter from './exam.router';
import questionRouter from './question.router';

import { fileController } from '../../controllers';
const router = Router();

router.use('/exams', examRouter);
router.use('/questions', questionRouter);

router.get('/files/:id/download', fileController.download);

export default router;
