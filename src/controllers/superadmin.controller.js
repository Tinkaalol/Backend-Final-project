import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';
import * as superadminService from '../services/superadmin.service.js';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain digit'),
  setupKey: z.string().min(1),
});

export const setup = [
  validateBody(setupSchema),
  asyncHandler(async (req, res) => {
    const { email, password, setupKey } = req.body;

    if (setupKey !== config.SUPERADMIN_SETUP_KEY) {
      return res.status(403).json({
        code: 'INVALID_SETUP_KEY',
        message: 'Invalid setup key',
      });
    }

    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
    if (existingSuperAdmin) {
      return res.status(409).json({
        code: 'SUPERADMIN_EXISTS',
        message: 'A superadmin already exists. Use POST /superadmin/superadmins to create additional ones.',
      });
    }

    const user = await superadminService.createSuperAdmin({ email, password });
    res.status(201).json({
      message: 'Superadmin created. Please check your email to verify your account before logging in.',
      user,
    });
  }),
];

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const listTenants = asyncHandler(async (_req, res) => {
  const tenants = await superadminService.listTenants();
  res.status(200).json({ data: tenants });
});

const createTenantSchema = z.object({
  name: z.string().min(1),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).optional(),
}).refine(
  (d) => !(d.adminEmail && !d.adminPassword) && !(!d.adminEmail && d.adminPassword),
  { message: 'Provide both adminEmail and adminPassword, or neither' },
);

export const createTenant = [
  validateBody(createTenantSchema),
  asyncHandler(async (req, res) => {
    const result = await superadminService.createTenant(req.body);
    res.status(201).json(result);
  }),
];

export const getTenant = asyncHandler(async (req, res) => {
  const tenant = await superadminService.getTenant(req.params.id);
  res.status(200).json(tenant);
});

const updateTenantSchema = z.object({
  name: z.string().min(1),
});

export const updateTenant = [
  validateBody(updateTenantSchema),
  asyncHandler(async (req, res) => {
    const tenant = await superadminService.updateTenant(req.params.id, req.body);
    res.status(200).json(tenant);
  }),
];

export const deleteTenant = asyncHandler(async (req, res) => {
  await superadminService.deleteTenant(req.params.id);
  res.status(204).send();
});

// ─── Users inside a tenant ───────────────────────────────────────────────────

export const listTenantUsers = asyncHandler(async (req, res) => {
  const users = await superadminService.listTenantUsers(req.params.id);
  res.status(200).json({ data: users });
});

const createTenantUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(['ADMIN', 'MANAGER', 'STOREKEEPER']).default('STOREKEEPER'),
});

export const createTenantUser = [
  validateBody(createTenantUserSchema),
  asyncHandler(async (req, res) => {
    const user = await superadminService.createTenantUser(req.params.id, req.body);
    res.status(201).json({ user });
  }),
];

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STOREKEEPER']),
});

export const updateTenantUserRole = [
  validateBody(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await superadminService.updateTenantUserRole(
      req.params.id,
      req.params.userId,
      req.body.role,
    );
    res.status(200).json(user);
  }),
];

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export const setTenantUserActive = [
  validateBody(setActiveSchema),
  asyncHandler(async (req, res) => {
    const user = await superadminService.setTenantUserActive(
      req.params.id,
      req.params.userId,
      req.body.isActive,
    );
    res.status(200).json(user);
  }),
];

// ─── Super-admins ─────────────────────────────────────────────────────────────

export const listSuperAdmins = asyncHandler(async (_req, res) => {
  const admins = await superadminService.listSuperAdmins();
  res.status(200).json({ data: admins });
});

const createSuperAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export const createSuperAdmin = [
  validateBody(createSuperAdminSchema),
  asyncHandler(async (req, res) => {
    const user = await superadminService.createSuperAdmin(req.body);
    res.status(201).json({
      message: 'Superadmin created. They must verify their email before logging in.',
      user,
    });
  }),
];

export const setSuperAdminActive = [
  validateBody(setActiveSchema),
  asyncHandler(async (req, res) => {
    const user = await superadminService.setSuperAdminActive(
      req.params.userId,
      req.user.id,
      req.body.isActive,
    );
    res.status(200).json(user);
  }),
];
