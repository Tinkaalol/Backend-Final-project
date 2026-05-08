import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { logAction } from '../utils/auditLogger.js';


export async function runDecayCycle(triggeredBy = 'SYSTEM') {
  const {
    DECAY_THRESHOLD_DAYS,
    DECAY_PERCENT_PER_CYCLE,
    DECAY_MAX_DISCOUNT,
  } = config;

  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      daysInInventory: { gt: DECAY_THRESHOLD_DAYS },
      discountPercent: { lt: DECAY_MAX_DISCOUNT },
    },
  });

  if (candidates.length === 0) {
    console.log('[Decay] No candidates found for this cycle');
    return { productsUpdated: 0 };
  }

  let updatedCount = 0;

  for (const product of candidates) {
    const newDiscountPercent = Math.min(
      product.discountPercent + DECAY_PERCENT_PER_CYCLE,
      DECAY_MAX_DISCOUNT
    );

    const newPrice = Math.floor(product.basePrice * (1 - newDiscountPercent / 100));

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          currentPrice: newPrice,
          discountPercent: newDiscountPercent,
          ...(newDiscountPercent >= DECAY_MAX_DISCOUNT && {
            status: 'CRITICAL_DEADSTOCK',
          }),
        },
      });

      await tx.decayEvent.create({
        data: {
          productId: product.id,
          previousPrice: product.currentPrice,
          newPrice,
          discountPercent: newDiscountPercent,
          daysInInventory: product.daysInInventory,
        },
      });

      if (newDiscountPercent >= DECAY_MAX_DISCOUNT) {
        const stocks = await tx.stock.findMany({ where: { productId: product.id } });
        for (const stock of stocks) {
          await tx.alert.create({
            data: {
              type: 'CRITICAL_DEADSTOCK',
              productId: product.id,
              locationId: stock.locationId,
            },
          });
        }
      }
    });

    console.log(
      `[Decay] Product ${product.sku}: ${product.currentPrice} KZT → ${newPrice} KZT (${newDiscountPercent}% off)`
    );
    updatedCount++;
  }

  console.log(`[Decay] Cycle complete. Updated ${updatedCount} products.`);
  return { productsUpdated: updatedCount };
}

export async function incrementDaysInInventory() {
  const result = await prisma.product.updateMany({
    where: { status: 'ACTIVE' },
    data: { daysInInventory: { increment: 1 } },
  });

  console.log(`[DailyTick] Incremented daysInInventory for ${result.count} products`);
  return result.count;
}
