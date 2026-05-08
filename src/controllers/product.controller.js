import { z } from 'zod';
import * as productService from '../services/product.service.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createProductSchema = z.object({
  sku: z.string().min(4).max(20).regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with dashes'),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum(['EQUIPMENT', 'COFFEE', 'ACCESSORIES']),
  basePrice: z.number().int().min(0, 'Price must be non-negative'),
  costPrice: z.number().int().min(0),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  basePrice: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'DISPLAY_SAMPLE', 'DISCONTINUED']).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(['EQUIPMENT', 'COFFEE', 'ACCESSORIES']).optional(),
  status: z.enum(['ACTIVE', 'DISPLAY_SAMPLE', 'DISCONTINUED', 'CRITICAL_DEADSTOCK']).optional(),
  brand: z.string().optional(),
  sort: z.enum(['createdAt', '-createdAt', 'currentPrice', '-currentPrice']).default('-createdAt'),
});

export const list = [
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await productService.listProducts(req.user.tenantId, req.query);
    res.status(200).json(result);
  }),
];

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id, req.user.tenantId);
  res.status(200).json(product);
});

export const create = [
  validateBody(createProductSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.createProduct(
      { ...req.body, tenantId: req.user.tenantId },
      req.user.id
    );
    res.status(201).json(product);
  }),
];

export const update = [
  validateBody(updateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(
      req.params.id,
      req.user.tenantId,
      req.body,
      req.user.id
    );
    res.status(200).json(product);
  }),
];

export const archive = asyncHandler(async (req, res) => {
  await productService.archiveProduct(req.params.id, req.user.tenantId, req.user.id);
  res.status(204).send();
});
