import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { managerOrAbove, allRoles } from '../middleware/rbac.js';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/income', allRoles, ...inventoryController.income);
router.post('/expense', allRoles, ...inventoryController.expense);
router.post('/transfer', managerOrAbove, ...inventoryController.transfer);
router.get('/history', allRoles, ...inventoryController.history);
router.get('/low-stock', allRoles, inventoryController.lowStock);

export default router;
