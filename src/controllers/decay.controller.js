import * as decayService from '../services/decay.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationArgs, buildPaginationResponse } from '../utils/pagination.js';
import { prisma } from '../config/database.js';

export const trigger = asyncHandler(async (req, res) => {
  const result = await decayService.runDecayCycle(req.user.id);
  res.status(200).json({
    message: `Decay cycle complete. ${result.productsUpdated} products received markdown.`,
    productsUpdated: result.productsUpdated,
  });
});

export const events = asyncHandler(async (req, res) => {
  const { take, cursor, limit } = buildPaginationArgs(req.query);

  const decayEvents = await prisma.decayEvent.findMany({
    where: {
      product: { tenantId: req.user.tenantId },
      ...(req.query.productId && { productId: req.query.productId }),
    },
    include: { product: { select: { id: true, sku: true, name: true } } },
    orderBy: { appliedAt: 'desc' },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  res.status(200).json(buildPaginationResponse(decayEvents, limit));
});
