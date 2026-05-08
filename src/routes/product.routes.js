import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { managerOrAbove, adminOnly } from '../middleware/rbac.js';
import * as productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', requireAuth, ...productController.list);
router.get('/:id', requireAuth, productController.getOne);
router.post('/', requireAuth, managerOrAbove, ...productController.create);
router.patch('/:id', requireAuth, managerOrAbove, ...productController.update);
router.delete('/:id', requireAuth, managerOrAbove, productController.archive);

export default router;
