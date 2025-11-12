import { Router } from 'express';
import { userController } from '../../controllers';
import { validateBody } from '../../middleware/validation.middleware';
import { uploadImage } from '../../utility/media.util';
import { updatePasswordUserSchema, updateUserSchema } from '../../validators';
import examAttemptRouter from './exam-attempt.router';
import examRouter from './exam.router';
import questionRouter from './question.router';
import ratingRouter from './rating.router';
const router = Router();

router.use('/exams', examRouter);
router.use('/exam-attempts', examAttemptRouter);
router.use('/questions', questionRouter);
router.use('/ratings', ratingRouter)
router.get('/me', userController.getMe.bind(userController));
router.get('/list', userController.index.bind(userController));
router.get('/:id', userController.detail.bind(userController));
router.put(
  '/password',
  validateBody(updatePasswordUserSchema),
  userController.updatePassword.bind(userController),
);
router.put(
  '/avatar',
  uploadImage.single('avatar'),
  userController.updateAvatar.bind(userController),
);
router.put(
  '/',
  validateBody(updateUserSchema),
  userController.update.bind(userController),
);
router.delete('/', userController.destroy.bind(userController));

export default router;
