import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SuperAdminShell } from '@/components/layout/SuperAdminShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { MovementsPage } from '@/pages/MovementsPage';
import { LocationsPage } from '@/pages/LocationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SetupPage } from '@/pages/superadmin/SetupPage';
import { TenantsPage } from '@/pages/superadmin/TenantsPage';
import { TenantDetailPage } from '@/pages/superadmin/TenantDetailPage';
import { SuperAdminsPage } from '@/pages/superadmin/SuperAdminsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/superadmin/setup" element={<SetupPage />} />

      {/* Super-admin panel — SuperAdminShell handles its own auth + role guard */}
      <Route element={<SuperAdminShell />}>
        <Route path="/superadmin" element={<Navigate to="/superadmin/tenants" replace />} />
        <Route path="/superadmin/tenants" element={<TenantsPage />} />
        <Route path="/superadmin/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/superadmin/admins" element={<SuperAdminsPage />} />
      </Route>

      {/* Regular app — redirects SUPERADMIN away to their panel */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/inventory" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/movements" element={<MovementsPage />} />
        <Route path="/locations" element={<LocationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
