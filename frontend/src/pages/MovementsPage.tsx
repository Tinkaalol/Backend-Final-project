import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, History, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableRowSkeleton } from '@/components/ui/Spinner';
import { useMovementHistory } from '@/features/inventory/hooks';
import { useLocations } from '@/features/locations/hooks';
import { TransferStockDialog } from '@/features/inventory/TransferStockDialog';
import { useAuth } from '@/features/auth/AuthContext';
import { extractErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type {
  MovementHistoryQuery,
  MovementLog,
  MovementType,
} from '@/types/inventory';

const TYPE_TONES: Record<MovementType, 'success' | 'danger' | 'info' | 'warn'> = {
  INCOME: 'success',
  EXPENSE: 'danger',
  ADJUSTMENT: 'info',
  WRITEOFF: 'warn',
};

export function MovementsPage() {
  const [query, setQuery] = useState<MovementHistoryQuery>({ limit: 20 });
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const locationsQuery = useLocations();
  const { user } = useAuth();

  const effective = useMemo(() => query, [query]);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useMovementHistory(effective);
  const movements = data?.data ?? [];
  const pagination = data?.pagination;

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  function updateFilter(patch: Partial<MovementHistoryQuery>) {
    setQuery((q) => ({ ...q, ...patch, cursor: undefined }));
    setCursorStack([]);
  }

  function nextPage() {
    if (!pagination?.nextCursor) return;
    setCursorStack((s) => [...s, query.cursor ?? '']);
    setQuery((q) => ({ ...q, cursor: pagination.nextCursor ?? undefined }));
  }

  function prevPage() {
    const stack = [...cursorStack];
    const prev = stack.pop() ?? '';
    setCursorStack(stack);
    setQuery((q) => ({ ...q, cursor: prev || undefined }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          Full audit trail of stock movements (income, expense, transfer, write-off).
        </p>
        {isManager && (
          <Button
            leadingIcon={<ArrowRight size={16} />}
            onClick={() => setShowTransferDialog(true)}
          >
            Transfer Stock
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="w-40"
          value={query.type ?? ''}
          onChange={(e) =>
            updateFilter({
              type: (e.target.value || undefined) as MovementType | undefined,
            })
          }
        >
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="WRITEOFF">Write-off</option>
        </Select>

        <Select
          className="w-56"
          value={query.locationId ?? ''}
          onChange={(e) =>
            updateFilter({ locationId: e.target.value || undefined })
          }
          disabled={locationsQuery.isLoading}
        >
          <option value="">All locations</option>
          {(locationsQuery.data ?? []).map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </Select>
      </div>

      {isError ? (
        <ErrorBanner
          message={extractErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : !isLoading && movements.length === 0 ? (
        <EmptyState
          icon={<History size={32} strokeWidth={1.5} />}
          title="No movements found"
          description="Try adjusting your filters or record some stock changes from the Inventory page."
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100 text-sm">
              <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Δ Qty</th>
                  <th className="px-4 py-3 text-right font-medium">After</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={8} />
                    ))
                  : movements.map((m) => <MovementRow key={m.id} movement={m} />)}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {pagination && (pagination.hasMore || cursorStack.length > 0) ? (
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>
            Showing {movements.length} record{movements.length === 1 ? '' : 's'}
            {isFetching ? ' · Updating…' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={cursorStack.length === 0}
              onClick={prevPage}
              leadingIcon={<ChevronLeft size={14} />}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasMore}
              onClick={nextPage}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ) : null}

      <TransferStockDialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
      />
    </div>
  );
}

function MovementRow({ movement }: { movement: MovementLog }) {
  const isPositive = movement.quantityDelta > 0;
  return (
    <tr className="hover:bg-ink-50/50">
      <td className="px-4 py-3 text-ink-700">{formatDateTime(movement.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-ink-900">
          {movement.stock?.product?.name ?? '—'}
        </div>
        <div className="text-xs text-ink-500">
          {movement.stock?.product?.sku ?? ''}
        </div>
      </td>
      <td className="px-4 py-3 text-ink-700">
        {movement.stock?.location?.name ?? '—'}
      </td>
      <td className="px-4 py-3">
        <Badge tone={TYPE_TONES[movement.type]}>{movement.type}</Badge>
      </td>
      <td
        className={`px-4 py-3 text-right font-semibold ${
          isPositive ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {isPositive ? '+' : ''}
        {movement.quantityDelta}
      </td>
      <td className="px-4 py-3 text-right text-ink-700">{movement.quantityAfter}</td>
      <td className="px-4 py-3 text-xs text-ink-500">{movement.user?.email ?? '—'}</td>
      <td className="max-w-[260px] truncate px-4 py-3 text-xs text-ink-500" title={movement.note ?? ''}>
        {movement.note ?? '—'}
      </td>
    </tr>
  );
}
