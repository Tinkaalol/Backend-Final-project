import { useState } from 'react';
import { Archive, Edit3, MoreVertical, Package } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useArchiveProduct } from './hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractErrorMessage } from '@/lib/api';
import { formatKZT } from '@/lib/format';
import { cn } from '@/lib/format';
import type { Product } from '@/types/product';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onAdjust: (product: Product) => void;
  onEdit: (product: Product) => void;
  onCreate: () => void;
  hasFilters: boolean;
}

const CATEGORY_LABEL: Record<Product['category'], string> = {
  COFFEE: 'Coffee',
  EQUIPMENT: 'Equipment',
  ACCESSORIES: 'Accessories',
};

export function ProductTable({
  products,
  loading,
  onAdjust,
  onEdit,
  onCreate,
  hasFilters,
}: ProductTableProps) {
  if (!loading && products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={36} strokeWidth={1.5} />}
        title={hasFilters ? 'No products match your filters' : 'No products yet'}
        description={
          hasFilters
            ? 'Try clearing filters or adjusting the search query.'
            : 'Add your first product to start tracking stock.'
        }
        action={!hasFilters ? <Button onClick={onCreate}>Add product</Button> : undefined}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="w-32 px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={7} />
                ))
              : products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onAdjust={onAdjust}
                    onEdit={onEdit}
                  />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onAdjust,
  onEdit,
}: {
  product: Product;
  onAdjust: (product: Product) => void;
  onEdit: (product: Product) => void;
}) {
  const totalStock =
    product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ??
    null;

  return (
    <tr className="bg-white hover:bg-ink-50/50">
      <td className="px-4 py-3">
        <div className="font-medium text-ink-900">{product.name}</div>
        <div className="text-xs text-ink-500">{product.brand}</div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-ink-600">{product.sku}</td>
      <td className="px-4 py-3 text-ink-700">{CATEGORY_LABEL[product.category]}</td>
      <td className="px-4 py-3">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-3 text-right">
        {totalStock === null ? (
          <span className="text-ink-400">—</span>
        ) : (
          <StockCell total={totalStock} />
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-ink-900">{formatKZT(product.currentPrice)}</div>
        {product.discountPercent > 0 ? (
          <div className="text-xs text-emerald-600">−{product.discountPercent}%</div>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" onClick={() => onAdjust(product)}>
            Adjust
          </Button>
          <RowMenu product={product} onEdit={onEdit} />
        </div>
      </td>
    </tr>
  );
}

function StockCell({ total }: { total: number }) {
  const tone =
    total === 0
      ? 'text-rose-600'
      : total < 10
        ? 'text-amber-600'
        : 'text-ink-900';
  return <span className={cn('font-medium', tone)}>{total}</span>;
}

function RowMenu({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const archive = useArchiveProduct();
  const toast = useToast();

  const isManagerOrAbove = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  async function handleArchive() {
    if (!window.confirm(`Archive "${product.name}"? It will be marked as discontinued.`)) {
      return;
    }
    try {
      await archive.mutateAsync(product.id);
      toast.success('Product archived');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="rounded-md p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop">
          {isManagerOrAbove ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                onEdit(product);
              }}
            >
              <Edit3 size={14} /> Edit details
            </button>
          ) : null}
          {isAdmin && product.status !== 'DISCONTINUED' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
              onMouseDown={(e) => {
                e.preventDefault();
                void handleArchive();
              }}
            >
              <Archive size={14} /> Archive
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
