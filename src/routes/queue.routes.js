import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQueueStatus } from '../config/queue.js';

const router = Router();

router.get('/status', requireAuth, adminOnly, asyncHandler(async (req, res) => {
  const status = await getQueueStatus();
  res.status(200).json(status);
}));

export default router;
