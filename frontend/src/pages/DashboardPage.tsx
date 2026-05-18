import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  History,
  PackageCheck,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CenteredSpinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/features/products/hooks';
import { useLowStock, useMovementHistory } from '@/features/inventory/hooks';
import { extractErrorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import type { MovementLog, MovementType } from '@/types/inventory';

export function DashboardPage() {
  const productsQuery = useProducts({ limit: 100 });
  const lowStockQuery = useLowStock();
  const movementsQuery = useMovementHistory({ limit: 8 });

  const products = productsQuery.data?.data ?? [];
  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const deadstockCount = products.filter((p) => p.status === 'CRITICAL_DEADSTOCK').length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-500">
        At-a-glance overview of catalog health, stock alerts and recent activity.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Boxes size={18} />}
          label="Active products"
          value={productsQuery.isLoading ? '…' : String(activeCount)}
        />
        <StatCard
          icon={<PackageCheck size={18} />}
          label="Total products"
          value={productsQuery.isLoading ? '…' : String(products.length)}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Low-stock alerts"
          tone={
            lowStockQuery.data && lowStockQuery.data.length > 0 ? 'warn' : 'neutral'
          }
          value={lowStockQuery.isLoading ? '…' : String(lowStockQuery.data?.length ?? 0)}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Deadstock"
          tone={deadstockCount > 0 ? 'danger' : 'neutral'}
          value={productsQuery.isLoading ? '…' : String(deadstockCount)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Low-stock alerts"
            description="Items at or below their reorder threshold."
            action={
              <Link
                to="/inventory"
                className="text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                View inventory →
              </Link>
            }
          />
          {lowStockQuery.isError ? (
            <ErrorBanner
              message={extractErrorMessage(lowStockQuery.error)}
              onRetry={() => void lowStockQuery.refetch()}
            />
          ) : lowStockQuery.isLoading ? (
            <CenteredSpinner />
          ) : lowStockQuery.data && lowStockQuery.data.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {lowStockQuery.data.slice(0, 6).map((a, i) => (
                <li key={`${a.product.id}-${a.location.id}-${i}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{a.product.name}</p>
                    <p className="text-xs text-ink-500">{a.location.name}</p>
                  </div>
                  <Badge tone="warn">
                    Triggered {formatRelative(a.triggeredAt)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<PackageCheck size={32} strokeWidth={1.5} />}
              title="All stock healthy"
              description="No items below threshold. Nice work."
              className="border-none bg-transparent py-6"
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent movements"
            description="Last stock changes across all locations."
            action={
              <Link
                to="/movements"
                className="text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                Full history →
              </Link>
            }
          />
          {movementsQuery.isError ? (
            <ErrorBanner
              message={extractErrorMessage(movementsQuery.error)}
              onRetry={() => void movementsQuery.refetch()}
            />
          ) : movementsQuery.isLoading ? (
            <CenteredSpinner />
          ) : movementsQuery.data && movementsQuery.data.data.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {movementsQuery.data.data.slice(0, 6).map((m) => (
                <MovementRow key={m.id} movement={m} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<History size={32} strokeWidth={1.5} />}
              title="No movements yet"
              description="Stock adjustments will appear here as they happen."
              className="border-none bg-transparent py-6"
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'warn' ? 'text-amber-700' : tone === 'danger' ? 'text-rose-700' : 'text-ink-900';
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
        <span className="text-ink-400">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function MovementRow({ movement }: { movement: MovementLog }) {
  const isPositive = movement.quantityDelta > 0;
  const tone: Record<MovementType, 'success' | 'danger' | 'info' | 'warn'> = {
    INCOME: 'success',
    EXPENSE: 'danger',
    ADJUSTMENT: 'info',
    WRITEOFF: 'warn',
  };
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900">
            {movement.stock?.product?.name ?? 'Product'}
          </p>
          <p className="text-xs text-ink-500">
            {movement.stock?.location?.name ?? 'Location'} ·{' '}
            {formatRelative(movement.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isPositive ? '+' : ''}
          {movement.quantityDelta}
        </span>
        <Badge tone={tone[movement.type]}>{movement.type}</Badge>
      </div>
    </li>
  );
}
