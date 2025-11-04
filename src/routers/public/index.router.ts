import { Router } from 'express';
import questionRouter from './question.router';

import { fileController } from '../../controllers';
const router = Router();

router.use('/questions', questionRouter);

router.get('/files/:id/download', fileController.download);

export default router;
