import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, managerOrAbove } from '../middleware/rbac.js';
import * as decayController from '../controllers/decay.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/events', managerOrAbove, decayController.events);
router.post('/trigger', adminOnly, decayController.trigger);

export default router;
