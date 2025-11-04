import { Router } from 'express';
import { userController } from '../../controllers';
import questionRouter from './question.router';

const router = Router();

router.use('/questions', questionRouter);

router.get('/me', userController.getMe);

export default router;
