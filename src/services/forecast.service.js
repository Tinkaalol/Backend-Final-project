import { prisma } from '../config/database.js';


export async function getForecast(productId, tenantId, weeksBack = 4) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    include: { stocks: { include: { location: true } } },
  });

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const since = new Date();
  since.setDate(since.getDate() - weeksBack * 7);

  const movements = await prisma.movementLog.findMany({
    where: {
      type: { in: ['EXPENSE', 'WRITEOFF'] },
      createdAt: { gte: since },
      stock: { productId },
    },
    select: { quantityDelta: true, createdAt: true },
  });

  const totalSold = movements.reduce((sum, m) => sum + Math.abs(m.quantityDelta), 0);

  const avgWeeklySales = weeksBack > 0 ? totalSold / weeksBack : 0;

  const leadTimeWeeks = 2;
  const reorderPoint = Math.ceil(avgWeeklySales * leadTimeWeeks);

  const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

  const weeksOfStockLeft = avgWeeklySales > 0
    ? (totalStock / avgWeeklySales).toFixed(1)
    : 'N/A (no sales data)';

  return {
    product: { id: product.id, sku: product.sku, name: product.name },
    forecast: {
      periodWeeks: weeksBack,
      totalSoldInPeriod: totalSold,
      avgWeeklySales: parseFloat(avgWeeklySales.toFixed(2)),
      reorderPoint,
      currentStock: totalStock,
      weeksOfStockLeft,
      needsReorder: totalStock <= reorderPoint,
    },
    stockByLocation: product.stocks.map(s => ({
      location: s.location.name,
      quantity: s.quantity,
    })),
  };
}

export async function getAllForecasts(tenantId, weeksBack = 4) {
  const products = await prisma.product.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { id: true },
  });

  const forecasts = await Promise.all(
    products.map(p => getForecast(p.id, tenantId, weeksBack).catch(() => null))
  );

  return forecasts
    .filter(Boolean)
    .sort((a, b) => (a.forecast.needsReorder === b.forecast.needsReorder ? 0 : a.forecast.needsReorder ? -1 : 1));
}
