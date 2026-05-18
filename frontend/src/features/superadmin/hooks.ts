import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as saApi from './api';
import type { CreateTenantInput } from '@/types/tenant';

function invalidateTenants(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sa-tenants'] });
}

// ── Tenants ───────────────────────────────────────────────────────────────────

export function useTenants() {
  return useQuery({ queryKey: ['sa-tenants'], queryFn: saApi.listTenants });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['sa-tenant', id],
    queryFn: () => saApi.getTenant(id as string),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => saApi.createTenant(input),
    onSuccess: () => invalidateTenants(qc),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      saApi.updateTenant(id, name),
    onSuccess: (_, { id }) => {
      invalidateTenants(qc);
      qc.invalidateQueries({ queryKey: ['sa-tenant', id] });
    },
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saApi.deleteTenant(id),
    onSuccess: () => invalidateTenants(qc),
  });
}

// ── Tenant users ──────────────────────────────────────────────────────────────

function invalidateTenant(qc: ReturnType<typeof useQueryClient>, tenantId: string) {
  qc.invalidateQueries({ queryKey: ['sa-tenant', tenantId] });
}

export function useCreateTenantUser(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; role: string }) =>
      saApi.createTenantUser(tenantId, input),
    onSuccess: () => invalidateTenant(qc, tenantId),
  });
}

export function useUpdateTenantUserRole(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      saApi.updateTenantUserRole(tenantId, userId, role),
    onSuccess: () => invalidateTenant(qc, tenantId),
  });
}

export function useSetTenantUserActive(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      saApi.setTenantUserActive(tenantId, userId, isActive),
    onSuccess: () => invalidateTenant(qc, tenantId),
  });
}

// ── Super-admins ──────────────────────────────────────────────────────────────

export function useSuperAdmins() {
  return useQuery({ queryKey: ['sa-superadmins'], queryFn: saApi.listSuperAdmins });
}

export function useCreateSuperAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      saApi.createSuperAdmin(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-superadmins'] }),
  });
}

export function useSetSuperAdminActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      saApi.setSuperAdminActive(userId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-superadmins'] }),
  });
}
