import { Router } from 'express';
import { examController } from '../../controllers';
import { validateBody } from '../../middleware/validation.middleware';
import { createExamSchema } from '../../validators';

const router = Router();

// CRUD
router.post(
  '/',
  validateBody(createExamSchema),
  examController.create.bind(examController),
);
router.get('/', examController.index.bind(examController));
router.get('/:id/preview', examController.detailPreview.bind(examController));
router.get('/:id', examController.detail.bind(examController));
router.put(
  '/:id',
  validateBody(createExamSchema),
  examController.update.bind(examController),
);
router.delete('/:id', examController.destroy.bind(examController));

export default router;
