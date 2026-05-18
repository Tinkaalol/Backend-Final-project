import { useEffect, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useCreateProduct, useUpdateProduct } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { extractErrorMessage } from '@/lib/api';
import type { Category, Product } from '@/types/product';

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

interface FormState {
  sku: string;
  name: string;
  brand: string;
  category: Category;
  basePrice: string;
  costPrice: string;
  status: 'ACTIVE' | 'DISPLAY_SAMPLE' | 'DISCONTINUED';
}

const blank: FormState = {
  sku: '',
  name: '',
  brand: '',
  category: 'COFFEE',
  basePrice: '',
  costPrice: '',
  status: 'ACTIVE',
};

export function ProductFormDialog({ open, onClose, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const [form, setForm] = useState<FormState>(blank);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setError(null);
      if (product) {
        setForm({
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          category: product.category,
          basePrice: String(product.basePrice),
          costPrice: String(product.costPrice),
          status:
            product.status === 'CRITICAL_DEADSTOCK' ? 'ACTIVE' : product.status,
        });
      } else {
        setForm(blank);
      }
    }
  }, [open, product]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const basePrice = parseInt(form.basePrice, 10);
    const costPrice = parseInt(form.costPrice, 10);

    if (Number.isNaN(basePrice) || Number.isNaN(costPrice)) {
      setError('Prices must be whole numbers (in ₸).');
      return;
    }

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          input: {
            name: form.name,
            brand: form.brand,
            basePrice,
            status: form.status,
          },
        });
        toast.success('Product updated');
      } else {
        await createMutation.mutateAsync({
          sku: form.sku.toUpperCase(),
          name: form.name,
          brand: form.brand,
          category: form.category,
          basePrice,
          costPrice,
        });
        toast.success('Product created');
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'New product'}
      description={
        isEdit
          ? 'Update product details. SKU and category cannot be changed.'
          : 'Add a new product to your catalog. Stock can be added afterward.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button form="product-form" type="submit" loading={submitting}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}

        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU" required htmlFor="sku">
            <Input
              id="sku"
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              disabled={isEdit}
              placeholder="PROD-001"
              required
              minLength={4}
              maxLength={20}
            />
          </Field>
          <Field label="Category" required htmlFor="category">
            <Select
              id="category"
              value={form.category}
              onChange={(e) => update('category', e.target.value as Category)}
              disabled={isEdit}
            >
              <option value="COFFEE">Coffee</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="ACCESSORIES">Accessories</option>
            </Select>
          </Field>
        </div>

        <Field label="Name" required htmlFor="name">
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            placeholder="Ethiopian Yirgacheffe 1 kg"
          />
        </Field>

        <Field label="Brand" required htmlFor="brand">
          <Input
            id="brand"
            value={form.brand}
            onChange={(e) => update('brand', e.target.value)}
            required
            placeholder="Origin Coffee"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Base price (₸)" required htmlFor="basePrice">
            <Input
              id="basePrice"
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => update('basePrice', e.target.value)}
              required
            />
          </Field>
          <Field
            label="Cost price (₸)"
            required
            htmlFor="costPrice"
            hint={isEdit ? 'Cost price is fixed after creation.' : undefined}
          >
            <Input
              id="costPrice"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => update('costPrice', e.target.value)}
              required
              disabled={isEdit}
            />
          </Field>
        </div>

        {isEdit ? (
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              value={form.status}
              onChange={(e) =>
                update('status', e.target.value as FormState['status'])
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="DISPLAY_SAMPLE">Display sample</option>
              <option value="DISCONTINUED">Discontinued</option>
            </Select>
          </Field>
        ) : null}
      </form>
    </Dialog>
  );
}
