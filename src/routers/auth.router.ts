import { Router } from 'express';

import { validateBody } from '../middleware/validation.middleware';
import { loginUserSchema, registerUserSchema } from '../validators';
import { authController } from '../controllers';
const router = Router();

router.post('/auth/login', validateBody(loginUserSchema), authController.login);
// router.post('/auth/logout', authController.logout);
// router.post(
//   '/auth/register',
//   validateBody(registerUserSchema),
//   authController.register,
// );

export default router;
