import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Category, ProductListQuery, ProductStatus } from '@/types/product';

interface ProductFiltersProps {
  value: ProductListQuery;
  onChange: (next: ProductListQuery) => void;
  brandSearch: string;
  onBrandSearchChange: (v: string) => void;
}

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'ACCESSORIES', label: 'Accessories' },
];

const STATUSES: Array<{ value: ProductStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISPLAY_SAMPLE', label: 'Display sample' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'CRITICAL_DEADSTOCK', label: 'Deadstock' },
];

export function ProductFilters({
  value,
  onChange,
  brandSearch,
  onBrandSearchChange,
}: ProductFiltersProps) {
  const hasFilters = !!(value.category || value.status || brandSearch);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[220px] flex-1">
        <Input
          placeholder="Search by brand or name…"
          leadingIcon={<Search size={16} />}
          value={brandSearch}
          onChange={(e) => onBrandSearchChange(e.target.value)}
        />
      </div>

      <Select
        className="w-40"
        value={value.category ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            category: (e.target.value || undefined) as Category | undefined,
          })
        }
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>

      <Select
        className="w-40"
        value={value.status ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            status: (e.target.value || undefined) as ProductStatus | undefined,
          })
        }
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<X size={14} />}
          onClick={() => {
            onChange({ sort: value.sort });
            onBrandSearchChange('');
          }}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
