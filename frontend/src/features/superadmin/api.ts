import { api } from '@/lib/api';
import type { Tenant, TenantDetail, CreateTenantInput } from '@/types/tenant';
import type { User } from '@/types/user';

// ── Setup ─────────────────────────────────────────────────────────────────────

export async function setupSuperAdmin(
  email: string,
  password: string,
  setupKey: string,
): Promise<{ message: string; user: User }> {
  const { data } = await api.post('/superadmin/setup', { email, password, setupKey });
  return data;
}

// ── Tenants ───────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<Tenant[]> {
  const { data } = await api.get<{ data: Tenant[] }>('/superadmin/tenants');
  return data.data;
}

export async function getTenant(id: string): Promise<TenantDetail> {
  const { data } = await api.get<TenantDetail>(`/superadmin/tenants/${id}`);
  return data;
}

export async function createTenant(
  input: CreateTenantInput,
): Promise<{ tenant: Tenant; admin: User | null }> {
  const { data } = await api.post('/superadmin/tenants', input);
  return data;
}

export async function updateTenant(
  id: string,
  name: string,
): Promise<Tenant> {
  const { data } = await api.patch<Tenant>(`/superadmin/tenants/${id}`, { name });
  return data;
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/superadmin/tenants/${id}`);
}

// ── Users inside tenant ────────────────────────────────────────────────────────

export async function createTenantUser(
  tenantId: string,
  input: { email: string; password: string; role: string },
): Promise<User> {
  const { data } = await api.post<{ user: User }>(
    `/superadmin/tenants/${tenantId}/users`,
    input,
  );
  return data.user;
}

export async function updateTenantUserRole(
  tenantId: string,
  userId: string,
  role: string,
): Promise<User> {
  const { data } = await api.patch<User>(
    `/superadmin/tenants/${tenantId}/users/${userId}/role`,
    { role },
  );
  return data;
}

export async function setTenantUserActive(
  tenantId: string,
  userId: string,
  isActive: boolean,
): Promise<User> {
  const { data } = await api.patch<User>(
    `/superadmin/tenants/${tenantId}/users/${userId}/active`,
    { isActive },
  );
  return data;
}

// ── Super-admins ──────────────────────────────────────────────────────────────

export async function listSuperAdmins(): Promise<User[]> {
  const { data } = await api.get<{ data: User[] }>('/superadmin/superadmins');
  return data.data;
}

export async function createSuperAdmin(
  email: string,
  password: string,
): Promise<{ message: string; user: User }> {
  const { data } = await api.post('/superadmin/superadmins', { email, password });
  return data;
}

export async function setSuperAdminActive(
  userId: string,
  isActive: boolean,
): Promise<User> {
  const { data } = await api.patch<User>(`/superadmin/superadmins/${userId}/active`, {
    isActive,
  });
  return data;
}
