import { LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200/70 bg-white px-6">
      <h1 className="text-base font-semibold text-ink-900">{title}</h1>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="text-right">
            <p className="text-sm font-medium text-ink-800">{user.email}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{user.role}</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          leadingIcon={<LogOut size={14} />}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
