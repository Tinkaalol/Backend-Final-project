import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-ink-400">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold text-ink-800">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
