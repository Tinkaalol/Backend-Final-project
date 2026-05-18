import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/features/auth/AuthContext';
import { CenteredSpinner } from '@/components/ui/Spinner';

const titles: Record<string, string> = {
  '/superadmin/tenants': 'Tenants',
  '/superadmin/admins': 'Super-admins',
};

function getTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith('/superadmin/tenants/')) return 'Tenant Details';
  return 'Super Admin';
}

export function SuperAdminShell() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <CenteredSpinner label="Restoring session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'SUPERADMIN') {
    return <Navigate to="/inventory" replace />;
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <SuperAdminSidebar />
      <main className="flex flex-1 flex-col">
        <TopBar title={getTitle(location.pathname)} />
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
