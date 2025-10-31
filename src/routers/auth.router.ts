import { Router } from 'express';

import { validateBody } from '../middleware/validation.middleware';
import { loginUserSchema, registerUserSchema } from '../validators';
import { authController } from '../controllers';
const router = Router();

console.log('authController:', authController);

// router.post('/auth/login', validateBody(loginUserSchema), authController.login);
router.post('/auth/login', validateBody(loginUserSchema), authController.login.bind(authController));

router.post('/auth/logout', authController.logout.bind(authController));

router.post(
  '/auth/register',
  validateBody(registerUserSchema),
  authController.register.bind(authController),
);

export default router;
