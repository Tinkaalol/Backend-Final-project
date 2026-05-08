import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

const TEST_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

beforeAll(async () => {
  await prisma.tenant.upsert({
    where: { id: TEST_TENANT_ID },
    create: { id: TEST_TENANT_ID, name: 'Test Coffee Store' },
    update: {},
  });
});

afterAll(async () => {
  // AuditLog must be deleted before users (foreign key constraint)
  await prisma.auditLog.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.user.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/login (validation)', () => {
  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('Auth flow: register → login → refresh → logout', () => {
  const testUser = {
    email: `test-${Date.now()}@leanstock.kz`,
    password: 'SecurePass1',
    role: 'STOREKEEPER',
    tenantId: TEST_TENANT_ID,
  };

  let accessToken;
  let refreshToken;

  it('POST /auth - register should create user and return profile', async () => {
    const { registerUser } = await import('../src/services/auth.service.js');
    const user = await registerUser(testUser);

    // Manually verify email so the user can log in during tests
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    expect(user.email).toBe(testUser.email);
    expect(user.role).toBe('STOREKEEPER');
    expect(user).not.toHaveProperty('passwordHash'); // never expose hash
  });

  it('POST /auth/login should return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(testUser.email);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/login with wrong password should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /auth/me with valid token should return user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('GET /auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /auth/me with fake token should return 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer fake.token.here');

    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh should return new access + refresh token (rotation)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // Old refreshToken is now revoked — save new one
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/logout should succeed and revoke token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    expect(res.status).toBe(204);
  });

  it('POST /auth/refresh after logout should return 401 TOKEN_REVOKED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_REVOKED');
  });
});

describe('RBAC: role restrictions', () => {
  const adminUser = {
    email: `admin-${Date.now()}@leanstock.kz`,
    password: 'AdminPass1',
    role: 'ADMIN',
    tenantId: TEST_TENANT_ID,
  };
  const storekeeperUser = {
    email: `keeper-${Date.now()}@leanstock.kz`,
    password: 'KeeperPass1',
    role: 'STOREKEEPER',
    tenantId: TEST_TENANT_ID,
  };

  let adminToken;
  let storekeeperToken;

  beforeAll(async () => {
    const { registerUser } = await import('../src/services/auth.service.js');
    await registerUser(adminUser);
    await registerUser(storekeeperUser);

    // Manually verify both accounts so login works in tests
    await prisma.user.updateMany({
      where: { email: { in: [adminUser.email, storekeeperUser.email] } },
      data: { isEmailVerified: true },
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.accessToken;

    const keeperLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: storekeeperUser.email, password: storekeeperUser.password });
    storekeeperToken = keeperLogin.body.accessToken;
  });

  it('STOREKEEPER should get 403 when trying to list users (ADMIN only)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${storekeeperToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('ADMIN should be able to list users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('STOREKEEPER should get 403 when trying to create product (MANAGER+ only)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${storekeeperToken}`)
      .send({
        sku: 'TEST-001',
        name: 'Test Product',
        brand: 'Test',
        category: 'EQUIPMENT',
        basePrice: 100000,
        costPrice: 70000,
      });

    expect(res.status).toBe(403);
  });
});
