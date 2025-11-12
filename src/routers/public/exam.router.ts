import { Router } from 'express';
import { examController } from '../../controllers';

const router = Router();

// CRUD
router.get('/', examController.index.bind(examController));
router.get('/:id', examController.detailPreview.bind(examController));

export default router;
