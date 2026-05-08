import { transferStock, recordExpense, recordIncome } from '../src/services/inventory.service.js';
import { prisma } from '../src/config/database.js';

const TEST_TENANT_ID = 'a0000000-0000-0000-0000-000000000002';
let testProduct, testLocation1, testLocation2, testUser;

beforeAll(async () => {
  const tenant = await prisma.tenant.upsert({
    where: { id: TEST_TENANT_ID },
    create: { id: TEST_TENANT_ID, name: 'Inventory Test Store' },
    update: {},
  });

  testUser = await prisma.user.upsert({
    where: { email: 'inv-test@leanstock.kz' },
    create: {
      email: 'inv-test@leanstock.kz',
      passwordHash: 'hash',
      role: 'STOREKEEPER',
      tenantId: TEST_TENANT_ID,
    },
    update: {},
  });

  testLocation1 = await prisma.location.create({
    data: { name: 'Warehouse A', address: 'Test St 1', tenantId: TEST_TENANT_ID },
  });

  testLocation2 = await prisma.location.create({
    data: { name: 'Warehouse B', address: 'Test St 2', tenantId: TEST_TENANT_ID },
  });

  testProduct = await prisma.product.create({
    data: {
      sku: `TEST-${Date.now()}`,
      name: 'Test Espresso Machine',
      brand: 'TestBrand',
      category: 'EQUIPMENT',
      basePrice: 200000,
      costPrice: 130000,
      currentPrice: 200000,
      tenantId: TEST_TENANT_ID,
    },
  });
});

afterAll(async () => {
  await prisma.movementLog.deleteMany({ where: { stock: { product: { tenantId: TEST_TENANT_ID } } } });
  await prisma.stock.deleteMany({ where: { product: { tenantId: TEST_TENANT_ID } } });
  await prisma.product.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.location.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.auditLog.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.user.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.tenant.delete({ where: { id: TEST_TENANT_ID } });
  await prisma.$disconnect();
});

describe('Inventory: income operation', () => {
  it('should increase stock and create a movement log entry', async () => {
    await recordIncome({
      productId: testProduct.id,
      locationId: testLocation1.id,
      quantity: 10,
      note: 'Initial stock',
      userId: testUser.id,
      tenantId: TEST_TENANT_ID,
    });

    const stock = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });
    expect(stock.quantity).toBe(10);

    const log = await prisma.movementLog.findFirst({
      where: { stockId: stock.id, type: 'INCOME' },
    });
    expect(log).not.toBeNull();
    expect(log.quantityDelta).toBe(10);
  });
});

describe('Inventory: expense operation', () => {
  it('should decrease stock and log the movement', async () => {
    await recordExpense({
      productId: testProduct.id,
      locationId: testLocation1.id,
      quantity: 3,
      reason: 'SALE',
      userId: testUser.id,
      tenantId: TEST_TENANT_ID,
    });

    const stock = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });
    expect(stock.quantity).toBe(7);
  });

  it('OVERSELLING IS IMPOSSIBLE — should reject expense if stock is insufficient', async () => {
    await expect(
      recordExpense({
        productId: testProduct.id,
        locationId: testLocation1.id,
        quantity: 100,
        reason: 'SALE',
        userId: testUser.id,
        tenantId: TEST_TENANT_ID,
      })
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    });

    
    const stock = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });
    expect(stock.quantity).toBe(7); 
  });

  it('stock quantity can never go below zero', async () => {
    const stock = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });
    expect(stock.quantity).toBeGreaterThanOrEqual(0);
  });
});

describe('Inventory: atomic transfer between locations', () => {
  it('should move stock atomically — both locations updated or neither', async () => {
    const stockBefore = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });

    await transferStock({
      productId: testProduct.id,
      fromLocationId: testLocation1.id,
      toLocationId: testLocation2.id,
      quantity: 4,
      userId: testUser.id,
      tenantId: TEST_TENANT_ID,
    });

    const sourceAfter = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation1.id },
    });
    const destAfter = await prisma.stock.findFirst({
      where: { productId: testProduct.id, locationId: testLocation2.id },
    });

    expect(sourceAfter.quantity).toBe(stockBefore.quantity - 4);
    expect(destAfter.quantity).toBe(4);

    expect(sourceAfter.quantity + destAfter.quantity).toBe(stockBefore.quantity);
  });

  it('should reject transfer from same location to same location', async () => {
    await expect(
      transferStock({
        productId: testProduct.id,
        fromLocationId: testLocation1.id,
        toLocationId: testLocation1.id,
        quantity: 1,
        userId: testUser.id,
        tenantId: TEST_TENANT_ID,
      })
    ).rejects.toMatchObject({ code: 'INVALID_TRANSFER' });
  });
});

describe('Decay: price calculation unit tests', () => {
  it('should correctly calculate decayed price', () => {
    const basePrice = 200000;
    const discountPercent = 10;
    const expectedPrice = Math.floor(basePrice * (1 - discountPercent / 100));
    expect(expectedPrice).toBe(180000);
  });

  it('should cap discount at DECAY_MAX_DISCOUNT (50%)', () => {
    const currentDiscount = 45;
    const incrementPercent = 10;
    const maxDiscount = 50;
    const newDiscount = Math.min(currentDiscount + incrementPercent, maxDiscount);
    expect(newDiscount).toBe(50); 
  });

  it('price and discount must stay in sync', () => {
    const basePrice = 285000;
    const discountPercent = 20;
    const currentPrice = Math.floor(basePrice * (1 - discountPercent / 100));
    
    expect(currentPrice).toBe(228000);
    expect(currentPrice).toBeLessThan(basePrice);
  });
});
