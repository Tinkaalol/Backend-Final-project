import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { authRateLimit as rateLimit } from '../middleware/rateLimiter.js';
import * as authService from '../services/auth.service.js';
import { prisma } from '../config/database.js';
import { z } from 'zod';
import { buildPaginationArgs, buildPaginationResponse } from '../utils/pagination.js';

const router = Router();

router.use(requireAuth);

router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const { take, cursor, limit } = buildPaginationArgs(req.query);

  const users = await prisma.user.findMany({
    where: { tenantId: req.user.tenantId },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  res.status(200).json(buildPaginationResponse(users, limit));
}));

router.post('/', rateLimit, adminOnly, validateBody(
  z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    role: z.enum(['ADMIN', 'MANAGER', 'STOREKEEPER']).default('STOREKEEPER'),
  })
), asyncHandler(async (req, res) => {
  const user = await authService.registerUser({
    ...req.body,
    tenantId: req.user.tenantId,
  });
  res.status(201).json({ user });
}));

router.get('/:id', adminOnly, asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, tenantId: req.user.tenantId },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
  res.status(200).json(user);
}));

router.patch('/:id', adminOnly, validateBody(
  z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'STOREKEEPER']).optional(),
    isActive: z.boolean().optional(),
  })
), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot modify your own account' });
  }
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
    select: { id: true, email: true, role: true, isActive: true },
  });
  res.status(200).json(updated);
}));

export default router;
