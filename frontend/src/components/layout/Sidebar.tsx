import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, Coffee, History, MapPin } from 'lucide-react';
import { cn } from '@/lib/format';
import { useAuth } from '@/features/auth/AuthContext';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['ADMIN'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER'] },
  { to: '/movements', label: 'Movements', icon: History, roles: ['ADMIN', 'MANAGER'] },
  { to: '/locations', label: 'Locations', icon: MapPin, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();

  const visibleItems = user?.role
    ? items.filter(item => item.roles.includes(user.role))
    : [];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-ink-200/70 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
          <Coffee size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink-900">LeanStock</p>
          <p className="text-xs uppercase tracking-wide text-ink-400">{user?.role}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100 px-5 py-4 text-[11px] text-ink-400">
        v0.1.0 · MVP
      </div>
    </aside>
  );
}
