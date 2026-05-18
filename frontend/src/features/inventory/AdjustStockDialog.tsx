import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useLocations } from '@/features/locations/hooks';
import { useToast } from '@/components/ui/Toast';
import { extractErrorMessage } from '@/lib/api';
import { useRecordExpense, useRecordIncome } from './hooks';
import type { Product } from '@/types/product';
import type { ExpenseReason } from '@/types/inventory';
import { cn } from '@/lib/format';

interface AdjustStockDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

type Mode = 'income' | 'expense';

export function AdjustStockDialog({ open, onClose, product }: AdjustStockDialogProps) {
  const [mode, setMode] = useState<Mode>('income');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<ExpenseReason>('SALE');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useLocations();
  const income = useRecordIncome();
  const expense = useRecordExpense();
  const toast = useToast();

  const locations = locationsQuery.data ?? [];

  const stockByLocation = useMemo(() => {
    const map = new Map<string, number>();
    product?.stocks?.forEach((s) => map.set(s.locationId, s.quantity));
    return map;
  }, [product]);

  useEffect(() => {
    if (open) {
      setMode('income');
      setQuantity('1');
      setReason('SALE');
      setNote('');
      setError(null);
      setLocationId(locations[0]?.id ?? '');
    }
  }, [open, locations]);

  if (!product) return null;

  const currentStock = locationId ? stockByLocation.get(locationId) ?? 0 : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError(null);
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 1) {
      setError('Quantity must be a positive integer.');
      return;
    }
    if (!locationId) {
      setError('Please choose a location.');
      return;
    }

    try {
      if (mode === 'income') {
        await income.mutateAsync({
          productId: product.id,
          locationId,
          quantity: qty,
          note: note || undefined,
        });
        toast.success(`+${qty} units added to stock`);
      } else {
        await expense.mutateAsync({
          productId: product.id,
          locationId,
          quantity: qty,
          reason,
          note: note || undefined,
        });
        toast.success(`-${qty} units removed from stock`);
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const submitting = income.isPending || expense.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description={`${product.name} · ${product.sku}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button form="adjust-stock-form" type="submit" loading={submitting}>
            {mode === 'income' ? 'Add stock' : 'Remove stock'}
          </Button>
        </>
      }
    >
      <form id="adjust-stock-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-100 p-1">
          <ModeButton
            active={mode === 'income'}
            onClick={() => setMode('income')}
            icon={<Plus size={14} />}
            label="Add stock"
            tone="success"
          />
          <ModeButton
            active={mode === 'expense'}
            onClick={() => setMode('expense')}
            icon={<Minus size={14} />}
            label="Remove stock"
            tone="danger"
          />
        </div>

        <Field label="Location" required htmlFor="location">
          <Select
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            disabled={locationsQuery.isLoading || locations.length === 0}
          >
            {locations.length === 0 ? (
              <option value="">No locations available</option>
            ) : (
              locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} (current: {stockByLocation.get(loc.id) ?? 0})
                </option>
              ))
            )}
          </Select>
        </Field>

        <Field
          label="Quantity"
          required
          htmlFor="quantity"
          hint={
            mode === 'expense' && locationId
              ? `Available at this location: ${currentStock}`
              : undefined
          }
        >
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </Field>

        {mode === 'expense' ? (
          <Field label="Reason" required htmlFor="reason">
            <Select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ExpenseReason)}
              required
            >
              <option value="SALE">Sale</option>
              <option value="DAMAGE">Damage</option>
              <option value="RETURN">Return</option>
              <option value="WRITEOFF">Write-off</option>
            </Select>
          </Field>
        ) : null}

        <Field label="Note (optional)" htmlFor="note">
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. weekly delivery, invoice #1234"
          />
        </Field>
      </form>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: 'success' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? tone === 'success'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-rose-600 text-white shadow-sm'
          : 'text-ink-600 hover:bg-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
