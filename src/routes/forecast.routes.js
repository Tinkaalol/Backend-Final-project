import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { managerOrAbove } from '../middleware/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as forecastService from '../services/forecast.service.js';

const router = Router();

router.use(requireAuth, managerOrAbove);

router.get('/', asyncHandler(async (req, res) => {
  const weeksBack = parseInt(req.query.weeks) || 4;
  const result = await forecastService.getAllForecasts(req.user.tenantId, weeksBack);
  res.status(200).json({ data: result, weeksAnalyzed: weeksBack });
}));

router.get('/:productId', asyncHandler(async (req, res) => {
  const weeksBack = parseInt(req.query.weeks) || 4;
  const result = await forecastService.getForecast(req.params.productId, req.user.tenantId, weeksBack);
  res.status(200).json(result);
}));

export default router;
