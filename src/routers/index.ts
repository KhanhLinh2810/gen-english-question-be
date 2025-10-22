import { Router } from 'express';

import authRoute from './auth.router';
import publicRoute from './public.router';

const router = Router();

router.use('/auth', authRoute);
router.use('/public', publicRoute);

router.use('/health', (req, res) => {
  return res.send('Server starting');
});

export { router };
