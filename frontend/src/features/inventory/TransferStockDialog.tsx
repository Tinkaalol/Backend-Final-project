import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useLocations } from '@/features/locations/hooks';
import { useProducts, useProduct } from '@/features/products/hooks';
import { useToast } from '@/components/ui/Toast';
import { extractErrorMessage } from '@/lib/api';
import { useTransferStock } from './hooks';

interface TransferStockDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TransferStockDialog({ open, onClose }: TransferStockDialogProps) {
  const [productId, setProductId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const locationsQuery = useLocations();
  const productsQuery = useProducts({ limit: 100 });
  const selectedProductQuery = useProduct(productId || undefined);
  const transfer = useTransferStock();
  const toast = useToast();

  const locations = locationsQuery.data ?? [];
  const products = productsQuery.data?.data ?? [];

  const selectedProduct = selectedProductQuery.data;
  const fromStock = selectedProduct?.stocks?.find((s) => s.locationId === fromLocationId);
  const currentStock = fromStock?.quantity ?? 0;

  useEffect(() => {
    if (open) {
      setProductId('');
      setFromLocationId(locations[0]?.id ?? '');
      setToLocationId(locations[1]?.id ?? '');
      setQuantity('1');
      setNote('');
      setError(null);
    }
  }, [open, locations]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('Please select a product.');
      return;
    }
    if (!fromLocationId) {
      setError('Please select a source location.');
      return;
    }
    if (!toLocationId) {
      setError('Please select a destination location.');
      return;
    }
    if (fromLocationId === toLocationId) {
      setError('Source and destination locations must be different.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 1) {
      setError('Quantity must be a positive integer.');
      return;
    }
    if (qty > currentStock) {
      setError(`Not enough stock. Available: ${currentStock}`);
      return;
    }

    try {
      await transfer.mutateAsync({
        productId,
        fromLocationId,
        toLocationId,
        quantity: qty,
        note: note || undefined,
      });
      toast.success(`Transferred ${qty} units`);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const submitting = transfer.isPending;
  const fromLocationName = locations.find((l) => l.id === fromLocationId)?.name;
  const toLocationName = locations.find((l) => l.id === toLocationId)?.name;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Transfer stock"
      description="Move products between warehouse locations"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button form="transfer-stock-form" type="submit" loading={submitting}>
            Transfer
          </Button>
        </>
      }
    >
      <form id="transfer-stock-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}

        <Field label="Product" required htmlFor="product">
          <Select
            id="product"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setError(null);
            }}
            disabled={productsQuery.isLoading || products.length === 0}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.sku}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From location" required htmlFor="from">
            <Select
              id="from"
              value={fromLocationId}
              onChange={(e) => {
                setFromLocationId(e.target.value);
                setError(null);
              }}
              disabled={locationsQuery.isLoading || locations.length < 2}
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="To location" required htmlFor="to">
            <Select
              id="to"
              value={toLocationId}
              onChange={(e) => {
                setToLocationId(e.target.value);
                setError(null);
              }}
              disabled={locationsQuery.isLoading || locations.length < 2}
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {fromLocationId && toLocationId && fromLocationName && toLocationName && (
          <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">
            <span>{fromLocationName}</span>
            <ArrowRight size={16} className="flex-shrink-0 text-ink-400" />
            <span>{toLocationName}</span>
          </div>
        )}

        <Field
          label="Quantity"
          required
          htmlFor="quantity"
          hint={
            productId && fromLocationId
              ? `Available at source: ${currentStock}`
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

        <Field label="Note (optional)" htmlFor="note">
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. seasonal rebalancing, store relocation"
          />
        </Field>
      </form>
    </Dialog>
  );
}
