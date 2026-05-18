import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  MapPin,
  Package,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CenteredSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  useCreateTenant,
  useDeleteTenant,
  useTenants,
} from '@/features/superadmin/hooks';
import { extractErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Tenant } from '@/types/tenant';

export function TenantsPage() {
  const { data: tenants, isLoading, isError, error, refetch } = useTenants();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-ink-500">
          All tenants registered in the system. Each tenant is an isolated company.
        </p>
        <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New tenant
        </Button>
      </div>

      {isError ? (
        <ErrorBanner message={extractErrorMessage(error)} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <CenteredSpinner />
      ) : !tenants || tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} strokeWidth={1.5} />}
          title="No tenants yet"
          description="Create the first tenant to get started."
          action={
            <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              New tenant
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {tenants.map((t) => (
            <TenantCard key={t.id} tenant={t} />
          ))}
        </div>
      )}

      <CreateTenantDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function TenantCard({ tenant }: { tenant: Tenant }) {
  const deleteMutation = useDeleteTenant();
  const toast = useToast();

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${tenant.name}"?\n\nThis will permanently delete ALL data including products, stock, movements, and users.`,
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync(tenant.id);
      toast.success(`Tenant "${tenant.name}" deleted`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{tenant.name}</p>
            <p className="text-xs text-ink-500">{formatDateTime(tenant.createdAt)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleteMutation.isPending}
          className="rounded-md p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label="Delete tenant"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {tenant._count ? (
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-ink-50 px-3 py-2 text-center text-xs">
          <CountPill icon={<Users size={12} />} label="Users" value={tenant._count.users} />
          <CountPill icon={<Package size={12} />} label="Products" value={tenant._count.products} />
          <CountPill icon={<MapPin size={12} />} label="Locations" value={tenant._count.locations} />
        </div>
      ) : null}

      <Link
        to={`/superadmin/tenants/${tenant.id}`}
        className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
      >
        Manage users & details
        <ChevronRight size={16} className="text-ink-400" />
      </Link>
    </Card>
  );
}

function CountPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="flex items-center gap-1 text-ink-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function CreateTenantDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateTenant();
  const toast = useToast();

  function reset() {
    setName('');
    setAdminEmail('');
    setAdminPassword('');
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = {
        name,
        ...(adminEmail ? { adminEmail, adminPassword } : {}),
      };
      const result = await mutation.mutateAsync(input);
      toast.success(
        result.admin
          ? `Tenant "${result.tenant.name}" created with admin ${result.admin.email}`
          : `Tenant "${result.tenant.name}" created`,
      );
      handleClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New tenant"
      description="Create a new isolated company workspace. Optionally invite the first admin."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="create-tenant-form" type="submit" loading={mutation.isPending}>
            Create tenant
          </Button>
        </>
      }
    >
      <form id="create-tenant-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}

        <Field label="Company name" required htmlFor="tenant-name">
          <Input
            id="tenant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Coffee Store KZ"
          />
        </Field>

        <div className="rounded-lg border border-ink-200 bg-ink-50/50 p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Initial admin (optional)
          </p>
          <Field label="Admin email" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
            />
          </Field>
          <Field
            label="Admin password"
            htmlFor="admin-password"
            hint="Min 8 chars, one uppercase, one digit"
          >
            <Input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
