import { prisma } from '../config/database.js';
import { logAction } from '../utils/auditLogger.js';
import { buildPaginationArgs, buildPaginationResponse } from '../utils/pagination.js';

export async function listProducts(tenantId, query) {
  const { take, cursor, skip, limit } = buildPaginationArgs(query);

  const where = {
    tenantId, 
    ...(query.category && { category: query.category }),
    ...(query.status && { status: query.status }),
    ...(query.brand && { brand: { contains: query.brand, mode: 'insensitive' } }),
  };

  const orderBy = query.sort?.startsWith('-')
    ? { [query.sort.slice(1)]: 'desc' }
    : { [query.sort ?? 'createdAt']: 'desc' };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  return buildPaginationResponse(products, limit);
}

export async function getProduct(id, tenantId) {
  const product = await prisma.product.findFirst({
    where: { id, tenantId }, 
    include: {
      stocks: { include: { location: true } },
    },
  });

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return product;
}

export async function createProduct(data, userId) {
  const product = await prisma.product.create({
    data: {
      ...data,
      currentPrice: data.basePrice,
    },
  });

  await logAction({
    userId,
    tenantId: data.tenantId,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
    newValue: { sku: product.sku, name: product.name, basePrice: product.basePrice },
  });

  return product;
}

export async function updateProduct(id, tenantId, updates, userId) {
  const existing = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!existing) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (updates.basePrice !== undefined) {
    updates.currentPrice = Math.floor(
      updates.basePrice * (1 - existing.discountPercent / 100)
    );
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updates,
  });

  await logAction({
    userId,
    tenantId,
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: id,
    oldValue: { name: existing.name, basePrice: existing.basePrice, status: existing.status },
    newValue: updates,
  });

  return updated;
}

export async function archiveProduct(id, tenantId, userId) {
  const existing = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!existing) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  await prisma.product.update({
    where: { id },
    data: { status: 'DISCONTINUED' },
  });

  await logAction({
    userId,
    tenantId,
    action: 'PRODUCT_ARCHIVED',
    entityType: 'Product',
    entityId: id,
    oldValue: { status: existing.status, name: existing.name },
    newValue: { status: 'DISCONTINUED' },
  });
}
