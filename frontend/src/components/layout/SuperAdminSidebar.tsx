import { NavLink } from 'react-router-dom';
import { Building2, ShieldCheck, Coffee } from 'lucide-react';
import { cn } from '@/lib/format';

const items = [
  { to: '/superadmin/tenants', label: 'Tenants', icon: Building2 },
  { to: '/superadmin/admins', label: 'Super-admins', icon: ShieldCheck },
];

export function SuperAdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-ink-200/70 bg-ink-900 md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
          <Coffee size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">LeanStock</p>
          <p className="text-[11px] uppercase tracking-wide text-white/40">Super Admin</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/30">
        v0.1.0 · Super Admin Panel
      </div>
    </aside>
  );
}
