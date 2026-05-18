import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { superAdminOnly } from '../middleware/rbac.js';
import * as ctrl from '../controllers/superadmin.controller.js';

const router = Router();

// Bootstrap — no auth, protected by setup key
router.post('/setup', ...ctrl.setup);

// Everything below requires SUPERADMIN auth
router.use(requireAuth, superAdminOnly);

// Tenants
router.get('/tenants', ctrl.listTenants);
router.post('/tenants', ...ctrl.createTenant);
router.get('/tenants/:id', ctrl.getTenant);
router.patch('/tenants/:id', ...ctrl.updateTenant);
router.delete('/tenants/:id', ctrl.deleteTenant);

// Users inside a tenant
router.get('/tenants/:id/users', ctrl.listTenantUsers);
router.post('/tenants/:id/users', ...ctrl.createTenantUser);
router.patch('/tenants/:id/users/:userId/role', ...ctrl.updateTenantUserRole);
router.patch('/tenants/:id/users/:userId/active', ...ctrl.setTenantUserActive);

// Superadmin management
router.get('/superadmins', ctrl.listSuperAdmins);
router.post('/superadmins', ...ctrl.createSuperAdmin);
router.patch('/superadmins/:userId/active', ...ctrl.setSuperAdminActive);

export default router;
