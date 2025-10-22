import { Router } from 'express';

import { fileController } from '../controllers';
const router = Router();

// file
router.get('/files/:id/download', fileController.download);

export default router;
