
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    create: { id: 'a0000000-0000-0000-0000-000000000001', name: 'Coffee Store KZ' },
    update: {},
  });
  console.log('✅ Tenant:', tenant.name);

  const passwordHash = await bcrypt.hash('AdminPass1', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@leanstock.kz' },
    create: {
      email: 'admin@leanstock.kz',
      passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
    update: {},
  });
  console.log('✅ Admin user:', admin.email);
  console.log('\nLogin credentials:');
  console.log('  email:    admin@leanstock.kz');
  console.log('  password: AdminPass1');

  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
