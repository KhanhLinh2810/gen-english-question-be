import { Router } from 'express';

import { authController } from '../controllers';
import { validateBody } from '../middleware/validation.middleware';
import { loginUserSchema, registerUserSchema } from '../validators';
const router = Router();

// router.post('/auth/login', validateBody(loginUserSchema), authController.login);
router.post(
  '/login',
  validateBody(loginUserSchema),
  authController.login.bind(authController),
);

router.post('/logout', authController.logout.bind(authController));

router.post(
  '/register',
  validateBody(registerUserSchema),
  authController.register.bind(authController),
);

export default router;
