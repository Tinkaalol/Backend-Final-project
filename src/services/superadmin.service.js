import { prisma } from '../config/database.js';
import { registerUser } from './auth.service.js';

// ─── Tenants ─────────────────────────────────────────────────────────────────

export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { users: true, products: true, locations: true },
      },
    },
  });
  return tenants;
}

export async function getTenant(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: { id: true, email: true, role: true, isActive: true, isEmailVerified: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
      locations: true,
      _count: { select: { products: true } },
    },
  });

  if (!tenant) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return tenant;
}

export async function createTenant({ name, adminEmail, adminPassword }) {
  const existing = await prisma.tenant.findFirst({ where: { name } });
  if (existing) {
    const err = new Error('A tenant with this name already exists');
    err.statusCode = 409;
    err.code = 'DUPLICATE_TENANT';
    throw err;
  }

  const tenant = await prisma.tenant.create({ data: { name } });

  let admin = null;
  if (adminEmail && adminPassword) {
    admin = await registerUser({
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    });
  }

  return { tenant, admin };
}

export async function updateTenant(tenantId, { name }) {
  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { name },
  });

  return updated;
}

export async function deleteTenant(tenantId) {
  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    const productIds = await tx.product
      .findMany({ where: { tenantId }, select: { id: true } })
      .then(rows => rows.map(r => r.id));

    if (productIds.length > 0) {
      const stockIds = await tx.stock
        .findMany({ where: { productId: { in: productIds } }, select: { id: true } })
        .then(rows => rows.map(r => r.id));

      if (stockIds.length > 0) {
        await tx.movementLog.deleteMany({ where: { stockId: { in: stockIds } } });
        await tx.stock.deleteMany({ where: { id: { in: stockIds } } });
      }

      await tx.decayEvent.deleteMany({ where: { productId: { in: productIds } } });
      await tx.alert.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { tenantId } });
    }

    await tx.alert.deleteMany({ where: { location: { tenantId } } });
    await tx.location.deleteMany({ where: { tenantId } });
    await tx.auditLog.deleteMany({ where: { tenantId } });
    await tx.user.deleteMany({ where: { tenantId } });
    await tx.tenant.delete({ where: { id: tenantId } });
  });
}

// ─── Users inside a tenant ───────────────────────────────────────────────────

export async function listTenantUsers(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return prisma.user.findMany({
    where: { tenantId },
    select: { id: true, email: true, role: true, isActive: true, isEmailVerified: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createTenantUser(tenantId, { email, password, role = 'STOREKEEPER' }) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return registerUser({ email, password, role, tenantId });
}

export async function updateTenantUserRole(tenantId, userId, role) {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) {
    const err = new Error('User not found in this tenant');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (role === 'SUPERADMIN') {
    const err = new Error('Cannot assign SUPERADMIN role through tenant management. Use /superadmin/superadmins.');
    err.statusCode = 400;
    err.code = 'INVALID_ROLE';
    throw err;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

export async function setTenantUserActive(tenantId, userId, isActive) {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) {
    const err = new Error('User not found in this tenant');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

// ─── Super-admins ─────────────────────────────────────────────────────────────

export async function createSuperAdmin({ email, password }) {
  return registerUser({ email, password, role: 'SUPERADMIN', tenantId: null });
}

export async function listSuperAdmins() {
  return prisma.user.findMany({
    where: { role: 'SUPERADMIN' },
    select: { id: true, email: true, isActive: true, isEmailVerified: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function setSuperAdminActive(targetId, requesterId, isActive) {
  if (targetId === requesterId) {
    const err = new Error('You cannot deactivate your own superadmin account');
    err.statusCode = 400;
    err.code = 'SELF_MODIFICATION';
    throw err;
  }

  const target = await prisma.user.findFirst({ where: { id: targetId, role: 'SUPERADMIN' } });
  if (!target) {
    const err = new Error('Superadmin not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return prisma.user.update({
    where: { id: targetId },
    data: { isActive },
    select: { id: true, email: true, isActive: true },
  });
}
