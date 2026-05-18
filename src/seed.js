
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID   = 'a0000000-0000-0000-0000-000000000001';
const LOC_ALMATY  = 'b0000000-0000-0000-0000-000000000001';
const LOC_ASTANA  = 'b0000000-0000-0000-0000-000000000002';
const PROD_IDS    = [
  'd0000000-0000-0000-0000-000000000001', 
  'd0000000-0000-0000-0000-000000000002', 
  'd0000000-0000-0000-0000-000000000003', 
  'd0000000-0000-0000-0000-000000000004', 
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000006', 
];

async function seed() {
  console.log('Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    create: { id: TENANT_ID, name: 'Coffee Store KZ' },
    update: {},
  });
  console.log('✅ Tenant:', tenant.name);

  
  const almaty = await prisma.location.upsert({
    where: { id: LOC_ALMATY },
    create: { id: LOC_ALMATY, name: 'Almaty Warehouse', address: 'Almaty, Raimbek Ave 212', tenantId: TENANT_ID },
    update: {},
  });

  const astana = await prisma.location.upsert({
    where: { id: LOC_ASTANA },
    create: { id: LOC_ASTANA, name: 'Astana Showroom', address: 'Astana, Mangilik El 55/20', tenantId: TENANT_ID },
    update: {},
  });

  console.log('✅ Locations:', almaty.name, '|', astana.name);

 
  const products = [
    {
      id: PROD_IDS[0],
      sku: 'PROD-001',
      name: 'DeLonghi Dedica EC685',
      brand: 'DeLonghi',
      category: 'EQUIPMENT',
      status: 'ACTIVE',
      basePrice:       180_000,
      costPrice:       120_000,
      discountPercent: 0,
      currentPrice:    180_000,
      daysInInventory: 5,       
      tenantId: TENANT_ID,
    },
    {
      id: PROD_IDS[1],
      sku: 'PROD-002',
      name: 'Breville Barista Express BES870',
      brand: 'Breville',
      category: 'EQUIPMENT',
      status: 'ACTIVE',
      basePrice:       450_000,
      costPrice:       290_000,
      discountPercent: 10,
      currentPrice:    405_000,
      daysInInventory: 35,     
      tenantId: TENANT_ID,
    },
    {
      id: PROD_IDS[2],
      sku: 'PROD-003',
      name: 'Ethiopian Yirgacheffe 1 kg',
      brand: 'Origin Coffee',
      category: 'COFFEE',
      status: 'ACTIVE',
      basePrice:       12_000,
      costPrice:        7_000,
      discountPercent: 20,
      currentPrice:     9_600,
      daysInInventory: 48,      
      tenantId: TENANT_ID,
    },
    {
      id: PROD_IDS[3],
      sku: 'PROD-004',
      name: 'Colombia Huila 500 g',
      brand: 'Origin Coffee',
      category: 'COFFEE',
      status: 'ACTIVE',
      basePrice:        8_500,
      costPrice:        5_000,
      discountPercent: 40,
      currentPrice:     5_100,
      daysInInventory: 65,      
      tenantId: TENANT_ID,
    },
    {
      id: PROD_IDS[4],
      sku: 'PROD-005',
      name: 'Nespresso Vertuo Next GCV1',
      brand: 'Nespresso',
      category: 'EQUIPMENT',
      status: 'ACTIVE',
      basePrice:       95_000,
      costPrice:       62_000,
      discountPercent: 0,
      currentPrice:    95_000,
      daysInInventory: 12,     
      tenantId: TENANT_ID,
    },
    {
      id: PROD_IDS[5],
      sku: 'PROD-006',
      name: 'Portafilter Cleaning Kit',
      brand: 'Barista Tools',
      category: 'ACCESSORIES',
      status: 'CRITICAL_DEADSTOCK',
      basePrice:       18_000,
      costPrice:        9_000,
      discountPercent: 50,
      currentPrice:     9_000,
      daysInInventory: 95,      
      tenantId: TENANT_ID,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: p,
      update: {},
    });
  }
  console.log(`✅ Products: ${products.length} created`);

  const stocks = [
    { productId: PROD_IDS[0], locationId: LOC_ALMATY, quantity: 20, reorderThreshold: 5 },
    { productId: PROD_IDS[1], locationId: LOC_ALMATY, quantity:  3, reorderThreshold: 5 },
    { productId: PROD_IDS[1], locationId: LOC_ASTANA, quantity:  2, reorderThreshold: 2 },
    { productId: PROD_IDS[2], locationId: LOC_ALMATY, quantity: 30, reorderThreshold: 10 },
    { productId: PROD_IDS[3], locationId: LOC_ALMATY, quantity:  4, reorderThreshold: 10 },
    { productId: PROD_IDS[4], locationId: LOC_ASTANA, quantity:  8, reorderThreshold: 3 },
    { productId: PROD_IDS[5], locationId: LOC_ALMATY, quantity:  2, reorderThreshold: 5 },
  ];

  for (const s of stocks) {
    await prisma.stock.upsert({
      where: { productId_locationId: { productId: s.productId, locationId: s.locationId } },
      create: s,
      update: {},
    });
  }
  console.log(`✅ Stock records: ${stocks.length} created`);

  const alerts = [
    { type: 'LOW_STOCK',         productId: PROD_IDS[1], locationId: LOC_ALMATY },
    { type: 'LOW_STOCK',         productId: PROD_IDS[3], locationId: LOC_ALMATY }, 
    { type: 'CRITICAL_DEADSTOCK', productId: PROD_IDS[5], locationId: LOC_ALMATY },
  ];

  for (const a of alerts) {
    const existing = await prisma.alert.findFirst({
      where: { productId: a.productId, locationId: a.locationId, type: a.type, isResolved: false },
    });
    if (!existing) {
      await prisma.alert.create({ data: a });
    }
  }
  console.log(`✅ Alerts: ${alerts.length} pre-seeded`);

  console.log('\n=== Location IDs ===');
  console.log('  Almaty Warehouse:', LOC_ALMATY);
  console.log('  Astana Showroom: ', LOC_ASTANA);
  console.log('\n=== Product SKUs ready for demo ===');
  console.log('  PROD-001  DeLonghi Dedica EC685           daysInInventory=5   (fresh, no decay)');
  console.log('  PROD-002  Breville Barista Express BES870 daysInInventory=35  (decay fires now, LOW_STOCK)');
  console.log('  PROD-003  Ethiopian Yirgacheffe 1kg       daysInInventory=48  (decay fires now)');
  console.log('  PROD-004  Colombia Huila 500g             daysInInventory=65  (next decay → CRITICAL, LOW_STOCK)');
  console.log('  PROD-005  Nespresso Vertuo Next           daysInInventory=12  (fresh, no decay)');
  console.log('  PROD-006  Portafilter Cleaning Kit        daysInInventory=95  (already CRITICAL_DEADSTOCK)');

  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
