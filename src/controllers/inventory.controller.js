import { z } from 'zod';
import * as inventoryService from '../services/inventory.service.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const incomeSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().min(1),
  note: z.string().optional(),
});

const expenseSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().min(1),
  reason: z.enum(['SALE', 'DAMAGE', 'RETURN', 'WRITEOFF']),
  note: z.string().optional(),
});

const transferSchema = z.object({
  productId: z.string().uuid(),
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  quantity: z.number().int().min(1),
  note: z.string().optional(),
});

const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'ADJUSTMENT', 'WRITEOFF']).optional(),
});

export const income = [
  validateBody(incomeSchema),
  asyncHandler(async (req, res) => {
    const stock = await inventoryService.recordIncome({
      ...req.body,
      userId: req.user.id,
      tenantId: req.user.tenantId,
    });
    res.status(201).json(stock);
  }),
];

export const expense = [
  validateBody(expenseSchema),
  asyncHandler(async (req, res) => {
    const stock = await inventoryService.recordExpense({
      ...req.body,
      userId: req.user.id,
      tenantId: req.user.tenantId,
    });
    res.status(201).json(stock);
  }),
];

export const transfer = [
  validateBody(transferSchema),
  asyncHandler(async (req, res) => {
    const result = await inventoryService.transferStock({
      ...req.body,
      userId: req.user.id,
      tenantId: req.user.tenantId,
    });
    res.status(200).json(result);
  }),
];

export const history = [
  validateQuery(historyQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await inventoryService.getMovementHistory(req.user.tenantId, req.query);
    res.status(200).json(result);
  }),
];

export const lowStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.getLowStockAlerts(
    req.user.tenantId,
    req.query.locationId
  );
  res.status(200).json({ data: result });
});
