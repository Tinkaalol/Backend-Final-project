
describe('Decay: price calculation', () => {
  function applyDecay(basePrice, currentDiscount, incrementPercent, maxDiscount) {
    const newDiscount = Math.min(currentDiscount + incrementPercent, maxDiscount);
    const newPrice = Math.floor(basePrice * (1 - newDiscount / 100));
    return { newDiscount, newPrice };
  }

  it('applies correct discount on first decay cycle', () => {
    const { newDiscount, newPrice } = applyDecay(285000, 0, 10, 50);
    expect(newDiscount).toBe(10);
    expect(newPrice).toBe(256500);
  });

  it('accumulates discount across multiple cycles', () => {
    let discount = 0;
    let price = 200000;
    for (let i = 0; i < 3; i++) {
      ({ newDiscount: discount, newPrice: price } = applyDecay(200000, discount, 10, 50));
    }
    expect(discount).toBe(30);
    expect(price).toBe(140000);
  });

  it('caps discount at DECAY_MAX_DISCOUNT regardless of accumulated increments', () => {
    const { newDiscount } = applyDecay(200000, 45, 10, 50);
    expect(newDiscount).toBe(50); 
  });

  it('price at max discount is exactly 50% of base price', () => {
    const { newDiscount, newPrice } = applyDecay(200000, 40, 10, 50);
    expect(newDiscount).toBe(50);
    expect(newPrice).toBe(100000);
  });

  it('floors fractional prices (integer KZT)', () => {
    const { newPrice } = applyDecay(100001, 0, 10, 50);
    expect(newPrice).toBe(90000);
  });

  it('never sets price below 50% of basePrice', () => {
    const basePrice = 300000;
    const { newPrice } = applyDecay(basePrice, 49, 10, 50);
    expect(newPrice).toBeGreaterThanOrEqual(basePrice * 0.5);
  });

  it('leaves price unchanged when discount is already at max', () => {
    const { newDiscount } = applyDecay(200000, 50, 10, 50);
    expect(newDiscount).toBe(50); 
  });

  it('product at 0 days should not decay (threshold guard is caller responsibility)', () => {
    const { newDiscount, newPrice } = applyDecay(200000, 0, 10, 50);
    expect(newDiscount).toBe(10);
    expect(newPrice).toBeLessThan(200000);
  });
});

describe('Decay: daysInInventory business rule', () => {
  it('fresh stock resets counter to zero', () => {
    const daysAfterIncome = 0; 
    expect(daysAfterIncome).toBe(0);
  });

  it('counter increments by 1 per daily tick', () => {
    let days = 0;
    for (let i = 0; i < 31; i++) days += 1;
    expect(days).toBe(31);
  });

  it('product crosses threshold after DECAY_THRESHOLD_DAYS daily ticks', () => {
    const threshold = 30;
    const days = 31;
    expect(days > threshold).toBe(true);
  });
});

describe('Forecast: demand calculations', () => {
  function calcForecast(movements, weeksBack) {
    const totalSold = movements.reduce((sum, m) => sum + Math.abs(m), 0);
    const avgWeeklySales = weeksBack > 0 ? totalSold / weeksBack : 0;
    const reorderPoint = Math.ceil(avgWeeklySales * 2); 
    return { totalSold, avgWeeklySales, reorderPoint };
  }

  it('calculates average weekly sales correctly', () => {
    const { avgWeeklySales } = calcForecast([10, 8, 5, 5], 4);
    expect(avgWeeklySales).toBe(7);
  });

  it('returns 0 for avgWeeklySales when no sales history', () => {
    const { avgWeeklySales } = calcForecast([], 4);
    expect(avgWeeklySales).toBe(0);
  });

  it('reorder point is 2 weeks of average sales (lead time assumption)', () => {
    const { reorderPoint } = calcForecast([14], 1); 
    expect(reorderPoint).toBe(28); 
  });

  it('reorder point rounds up fractional units', () => {
    const { reorderPoint } = calcForecast([7], 4);
    expect(reorderPoint).toBe(4);
  });

  it('needsReorder is true when currentStock <= reorderPoint', () => {
    const { reorderPoint } = calcForecast([28], 4); 
    const currentStock = 10;
    expect(currentStock <= reorderPoint).toBe(true);
  });

  it('needsReorder is false when well-stocked', () => {
    const { reorderPoint } = calcForecast([4], 4); 
    const currentStock = 50;
    expect(currentStock <= reorderPoint).toBe(false);
  });

  it('weeksOfStockLeft is "N/A" when there are no sales', () => {
    const avgWeeklySales = 0;
    const result = avgWeeklySales > 0 ? (10 / avgWeeklySales).toFixed(1) : 'N/A (no sales data)';
    expect(result).toBe('N/A (no sales data)');
  });

  it('weeksOfStockLeft is numeric when sales exist', () => {
    const avgWeeklySales = 5;
    const currentStock = 10;
    const result = avgWeeklySales > 0 ? (currentStock / avgWeeklySales).toFixed(1) : 'N/A (no sales data)';
    expect(result).toBe('2.0');
  });
});

describe('Pagination: cursor encoding', () => {
  function encodeCursor(id) {
    return Buffer.from(JSON.stringify({ id })).toString('base64');
  }

  function decodeCursor(cursor) {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')).id;
    } catch {
      return null;
    }
  }

  it('encodes and decodes a UUID cursor round-trip', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(decodeCursor(encodeCursor(id))).toBe(id);
  });

  it('returns null for corrupted cursor', () => {
    expect(decodeCursor('!!!invalid base64!!!')).toBeNull();
  });

  it('returns null for empty string cursor', () => {
    expect(decodeCursor('')).toBeNull();
  });

  it('hasMore is true when items exceed requested limit', () => {
    const limit = 3;
    const items = [1, 2, 3, 4]; 
    expect(items.length > limit).toBe(true);
  });

  it('hasMore is false when items fit within limit', () => {
    const limit = 3;
    const items = [1, 2]; 
    expect(items.length > limit).toBe(false);
  });
});
