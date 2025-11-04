import { Router } from 'express';

import { verifyToken } from '../middleware/authenticate.middleware';
import authRoute from './auth.router';
import publicRoute from './public/index.router';
import userRoute from './user/index.router';

const router = Router();

router.use('/auth', authRoute);
router.use('/public', publicRoute);
router.use('/user', verifyToken, userRoute);

router.use('/health', (req, res) => {
  return res.send('Server starting');
});

export { router };
