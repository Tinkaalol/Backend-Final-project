import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ProductTable } from '@/features/products/ProductTable';
import { ProductFilters } from '@/features/products/ProductFilters';
import { ProductFormDialog } from '@/features/products/ProductFormDialog';
import { AdjustStockDialog } from '@/features/inventory/AdjustStockDialog';
import { useProducts, useProduct } from '@/features/products/hooks';
import { extractErrorMessage } from '@/lib/api';
import type { Product, ProductListQuery } from '@/types/product';

export function InventoryPage() {
  const [query, setQuery] = useState<ProductListQuery>({ sort: '-createdAt', limit: 20 });
  const [brandSearch, setBrandSearch] = useState('');
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);

  const fullProduct = useProduct(adjustingProductId || undefined);

  const debouncedBrand = useDebounce(brandSearch, 300);

  const effectiveQuery = useMemo<ProductListQuery>(
    () => ({
      ...query,
      brand: debouncedBrand || undefined,
    }),
    [query, debouncedBrand],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts(effectiveQuery);
  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const hasFilters = !!(effectiveQuery.category || effectiveQuery.status || debouncedBrand);

  function handleFiltersChange(next: ProductListQuery) {
    setQuery({ ...next, cursor: undefined });
    setCursorStack([]);
  }

  function handleBrandSearchChange(value: string) {
    setBrandSearch(value);
    setQuery((q) => ({ ...q, cursor: undefined }));
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

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">
            Manage your catalog and adjust stock per location.
          </p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={openCreate}>
          New product
        </Button>
      </div>

      <ProductFilters
        value={query}
        onChange={handleFiltersChange}
        brandSearch={brandSearch}
        onBrandSearchChange={handleBrandSearchChange}
      />

      {isError ? (
        <ErrorBanner
          message={extractErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <ProductTable
          products={products}
          loading={isLoading}
          onAdjust={(p) => setAdjustingProductId(p.id)}
          onEdit={openEdit}
          onCreate={openCreate}
          hasFilters={hasFilters}
        />
      )}

      {pagination && (pagination.hasMore || cursorStack.length > 0) ? (
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>
            Showing {products.length} item{products.length === 1 ? '' : 's'}
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

      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editingProduct}
      />

      <AdjustStockDialog
        open={!!adjustingProductId}
        onClose={() => setAdjustingProductId(null)}
        product={fullProduct.data ?? null}
      />
    </div>
  );
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}
