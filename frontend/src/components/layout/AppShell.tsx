import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/movements': 'Stock Movements',
  '/locations': 'Locations',
};

export function AppShell() {
  const location = useLocation();
  const title = titles[location.pathname] ?? 'LeanStock';

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <TopBar title={title} />
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
