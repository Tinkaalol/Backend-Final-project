import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
  console.log('Clearing all data...');

  // Delete in dependency order (children before parents)
  await prisma.auditLog.deleteMany();
  await prisma.decayEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.movementLog.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('Done. Run node src/seed.js to recreate admin account.');
  await prisma.$disconnect();
}

reset().catch(e => { console.error(e); process.exit(1); });
