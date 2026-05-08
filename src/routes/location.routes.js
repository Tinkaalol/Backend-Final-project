import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, managerOrAbove, allRoles } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../config/database.js';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

router.get('/', allRoles, asyncHandler(async (req, res) => {
  const locations = await prisma.location.findMany({
    where: { tenantId: req.user.tenantId },
  });
  res.status(200).json({ data: locations });
}));

router.post('/', adminOnly, validateBody(
  z.object({
    name: z.string().min(1),
    address: z.string().min(1),
  })
), asyncHandler(async (req, res) => {
  const location = await prisma.location.create({
    data: { ...req.body, tenantId: req.user.tenantId },
  });
  res.status(201).json(location);
}));

router.get('/:id', allRoles, asyncHandler(async (req, res) => {
  const location = await prisma.location.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId },
    include: { stocks: { include: { product: true } } },
  });
  if (!location) return res.status(404).json({ code: 'NOT_FOUND', message: 'Location not found' });
  res.status(200).json(location);
}));

export default router;
