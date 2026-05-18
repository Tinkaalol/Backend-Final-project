import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  MapPin,
  Package,
  Plus,
  Users,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CenteredSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  useCreateTenantUser,
  useSetTenantUserActive,
  useTenant,
  useUpdateTenantUserRole,
  useUpdateTenant,
} from '@/features/superadmin/hooks';
import { extractErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { User } from '@/types/user';

const ROLE_TONES: Record<string, 'success' | 'warn' | 'neutral'> = {
  ADMIN: 'success',
  MANAGER: 'warn',
  STOREKEEPER: 'neutral',
};

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading, isError, error, refetch } = useTenant(id);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  if (isLoading) return <CenteredSpinner />;
  if (isError || !tenant)
    return (
      <ErrorBanner
        message={extractErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/superadmin/tenants"
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Tenants
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Building2 size={26} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink-900">{tenant.name}</h2>
            <p className="text-sm text-ink-500">Created {formatDateTime(tenant.createdAt)}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setRenameOpen(true)}>
          Rename
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={<Users size={16} />} label="Users" value={tenant.users.length} />
        <StatTile icon={<Package size={16} />} label="Products" value={tenant._count.products} />
        <StatTile icon={<MapPin size={16} />} label="Locations" value={tenant.locations.length} />
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <CardHeader title="Users" description="All members of this tenant." className="pb-0" />
          <Button
            size="sm"
            leadingIcon={<Plus size={14} />}
            onClick={() => setAddUserOpen(true)}
          >
            Add user
          </Button>
        </div>

        {tenant.users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} strokeWidth={1.5} />}
            title="No users yet"
            description="Add the first user to this tenant."
            className="m-4 border-dashed"
          />
        ) : (
          <table className="min-w-full divide-y divide-ink-100 text-sm">
            <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="w-48 px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tenant.users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  tenantId={tenant.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {tenant.locations.length > 0 ? (
        <Card>
          <CardHeader title="Locations" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tenant.locations.map((loc) => (
              <div key={loc.id} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                <MapPin size={14} className="text-ink-400" />
                <div>
                  <p className="text-sm font-medium text-ink-800">{loc.name}</p>
                  <p className="text-xs text-ink-500">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <AddUserDialog
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        tenantId={tenant.id}
      />

      <RenameTenantDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        tenantId={tenant.id}
        currentName={tenant.name}
      />
    </div>
  );
}

function UserRow({ user, tenantId }: { user: User; tenantId: string }) {
  const roleMutation = useUpdateTenantUserRole(tenantId);
  const activeMutation = useSetTenantUserActive(tenantId);
  const toast = useToast();

  async function handleRoleChange(role: string) {
    try {
      await roleMutation.mutateAsync({ userId: user.id, role });
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleToggleActive() {
    try {
      await activeMutation.mutateAsync({ userId: user.id, isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <tr className="hover:bg-ink-50/50">
      <td className="px-4 py-3 font-medium text-ink-900">{user.email}</td>
      <td className="px-4 py-3">
        <Select
          className="h-8 w-36 text-xs"
          value={user.role}
          onChange={(e) => void handleRoleChange(e.target.value)}
          disabled={roleMutation.isPending}
        >
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STOREKEEPER">Storekeeper</option>
        </Select>
      </td>
      <td className="px-4 py-3">
        <Badge tone={user.isActive ? 'success' : 'neutral'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {user.isEmailVerified ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <XCircle size={16} className="text-ink-300" />
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink-500">{formatDateTime(user.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          variant={user.isActive ? 'secondary' : 'ghost'}
          onClick={() => void handleToggleActive()}
          loading={activeMutation.isPending}
        >
          {user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </td>
    </tr>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
        <span className="text-ink-400">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
    </Card>
  );
}

function AddUserDialog({
  open,
  onClose,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STOREKEEPER');
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateTenantUser(tenantId);
  const toast = useToast();

  function handleClose() {
    setEmail('');
    setPassword('');
    setRole('STOREKEEPER');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ email, password, role });
      toast.success(`User ${email} created and verification email sent`);
      handleClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add user"
      description="Create a new user for this tenant. A verification email will be sent."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="add-user-form" type="submit" loading={mutation.isPending}>
            Create user
          </Button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}
        <Field label="Email" required htmlFor="new-user-email">
          <Input
            id="new-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" required htmlFor="new-user-password" hint="Min 8 chars, one uppercase, one digit">
          <Input
            id="new-user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Role" htmlFor="new-user-role">
          <Select
            id="new-user-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="STOREKEEPER">Storekeeper</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  );
}

function RenameTenantDialog({
  open,
  onClose,
  tenantId,
  currentName,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateTenant();
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ id: tenantId, name });
      toast.success('Tenant renamed');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Rename tenant"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="rename-form" type="submit" loading={mutation.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="rename-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}
        <Field label="New name" required htmlFor="rename-input">
          <Input
            id="rename-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
      </form>
    </Dialog>
  );
}
