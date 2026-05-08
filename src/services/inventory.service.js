import { prisma } from '../config/database.js';
import { logAction } from '../utils/auditLogger.js';
import { buildPaginationArgs, buildPaginationResponse } from '../utils/pagination.js';

export async function recordIncome({ productId, locationId, quantity, note, userId, tenantId }) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  });
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.upsert({
      where: { productId_locationId: { productId, locationId } },
      create: { productId, locationId, quantity, reorderThreshold: 5 },
      update: { quantity: { increment: quantity } },
    });

    const updatedStock = await tx.stock.findUnique({ where: { id: stock.id } });

    await tx.product.update({
      where: { id: productId },
      data: { daysInInventory: 0 },
    });

    const movement = await tx.movementLog.create({
      data: {
        stockId: stock.id,
        userId,
        type: 'INCOME',
        quantityDelta: quantity,
        quantityAfter: updatedStock.quantity,
        note,
      },
    });

    return { stock: updatedStock, movement };
  });

  await logAction({
    userId,
    tenantId,
    action: 'STOCK_INCOME',
    entityType: 'Stock',
    entityId: result.stock.id,
    newValue: { quantity, locationId, productId },
  });

  return result.stock;
}

export async function recordExpense({ productId, locationId, quantity, reason, note, userId, tenantId }) {
  const result = await prisma.$transaction(async (tx) => {
    const existingStock = await tx.stock.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    if (!existingStock) {
      const err = new Error('No stock record found for this product at this location');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const updated = await tx.stock.updateMany({
      where: { productId, locationId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (updated.count === 0) {
      const err = new Error(
        `Insufficient stock: requested ${quantity}, available ${existingStock.quantity}`
      );
      err.statusCode = 409;
      err.code = 'INSUFFICIENT_STOCK';
      err.details = { requested: quantity, available: existingStock.quantity, locationId };
      throw err;
    }

    const updatedStock = await tx.stock.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    const movement = await tx.movementLog.create({
      data: {
        stockId: existingStock.id,
        userId,
        type: reason === 'WRITEOFF' ? 'WRITEOFF' : 'EXPENSE',
        quantityDelta: -quantity,
        quantityAfter: updatedStock.quantity,
        note: note ?? reason,
      },
    });

    if (updatedStock.quantity <= updatedStock.reorderThreshold) {
      await tx.alert.upsert({
        where: {
          id: (await tx.alert.findFirst({
            where: { productId, locationId, isResolved: false, type: 'LOW_STOCK' },
          }))?.id ?? 'new',
        },
        create: { type: 'LOW_STOCK', productId, locationId },
        update: {},
      }).catch(() => {
        return tx.alert.create({ data: { type: 'LOW_STOCK', productId, locationId } });
      });
    }

    return { stock: updatedStock, movement };
  });

  await logAction({
    userId,
    tenantId,
    action: 'STOCK_EXPENSE',
    entityType: 'Stock',
    entityId: result.stock.id,
    newValue: { quantity, locationId, productId, reason },
  });

  return result.stock;
}

export async function transferStock({ productId, fromLocationId, toLocationId, quantity, note, userId, tenantId }) {
  if (fromLocationId === toLocationId) {
    const err = new Error('Source and destination locations must be different');
    err.statusCode = 400;
    err.code = 'INVALID_TRANSFER';
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const sourceStock = await tx.stock.findUnique({
      where: { productId_locationId: { productId, locationId: fromLocationId } },
    });

    if (!sourceStock) {
      const err = new Error('No stock found at source location');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (sourceStock.quantity < quantity) {
      const err = new Error(`Insufficient stock at source: requested ${quantity}, available ${sourceStock.quantity}`);
      err.statusCode = 409;
      err.code = 'INSUFFICIENT_STOCK';
      err.details = { requested: quantity, available: sourceStock.quantity };
      throw err;
    }

    const sourceUpdate = await tx.stock.updateMany({
      where: { productId, locationId: fromLocationId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (sourceUpdate.count === 0) {
      const err = new Error(`Insufficient stock at source (concurrent modification): requested ${quantity}`);
      err.statusCode = 409;
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    const updatedSource = await tx.stock.findUnique({
      where: { productId_locationId: { productId, locationId: fromLocationId } },
    });

    const updatedDest = await tx.stock.upsert({
      where: { productId_locationId: { productId, locationId: toLocationId } },
      create: { productId, locationId: toLocationId, quantity },
      update: { quantity: { increment: quantity } },
    });

    await tx.movementLog.create({
      data: {
        stockId: sourceStock.id,
        userId,
        type: 'EXPENSE',
        quantityDelta: -quantity,
        quantityAfter: updatedSource.quantity,
        note: note ?? `Transfer to location ${toLocationId}`,
      },
    });

    await tx.movementLog.create({
      data: {
        stockId: updatedDest.id,
        userId,
        type: 'INCOME',
        quantityDelta: quantity,
        quantityAfter: updatedDest.quantity,
        note: note ?? `Transfer from location ${fromLocationId}`,
      },
    });

    return { from: updatedSource, to: updatedDest };
  });

  await logAction({
    userId,
    tenantId,
    action: 'STOCK_TRANSFER',
    entityType: 'Stock',
    entityId: productId,
    newValue: { fromLocationId, toLocationId, quantity },
  });

  return result;
}

export async function getMovementHistory(tenantId, query) {
  const { take, cursor, limit } = buildPaginationArgs(query);

  const movements = await prisma.movementLog.findMany({
    where: {
      ...(query.productId && { stock: { productId: query.productId } }),
      ...(query.locationId && { stock: { locationId: query.locationId } }),
      ...(query.type && { type: query.type }),
      stock: { product: { tenantId } }, 
    },
    include: {
      stock: { include: { product: true, location: true } },
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  return buildPaginationResponse(movements, limit);
}

export async function getLowStockAlerts(tenantId, locationId) {
  const alerts = await prisma.alert.findMany({
    where: {
      isResolved: false,
      type: 'LOW_STOCK',
      product: { tenantId },
      ...(locationId && { locationId }),
    },
    include: {
      product: true,
      location: true,
    },
  });

  return alerts.map(alert => ({
    product: alert.product,
    location: alert.location,
    deficit: alert.product.stocks?.find(s => s.locationId === alert.locationId)
      ? alert.product.stocks.find(s => s.locationId === alert.locationId).reorderThreshold -
        alert.product.stocks.find(s => s.locationId === alert.locationId).quantity
      : null,
    triggeredAt: alert.triggeredAt,
  }));
}
