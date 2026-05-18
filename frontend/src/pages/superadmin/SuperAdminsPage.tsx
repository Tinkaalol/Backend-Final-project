import { useState, type FormEvent } from 'react';
import { CheckCircle2, Plus, ShieldCheck, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CenteredSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  useCreateSuperAdmin,
  useSetSuperAdminActive,
  useSuperAdmins,
} from '@/features/superadmin/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { extractErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { User } from '@/types/user';

export function SuperAdminsPage() {
  const { data: admins, isLoading, isError, error, refetch } = useSuperAdmins();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-ink-500">
          Global super-admins who can manage all tenants.
        </p>
        <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Add super-admin
        </Button>
      </div>

      {isError ? (
        <ErrorBanner message={extractErrorMessage(error)} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <CenteredSpinner />
      ) : !admins || admins.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={36} strokeWidth={1.5} />}
          title="No super-admins"
          description="Something went wrong — there should always be at least one."
        />
      ) : (
        <Card padding="none">
          <table className="min-w-full divide-y divide-ink-100 text-sm">
            <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email verified</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="w-36 px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {admins.map((admin) => (
                <AdminRow key={admin.id} admin={admin} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CreateSuperAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function AdminRow({ admin }: { admin: User }) {
  const { user: me } = useAuth();
  const mutation = useSetSuperAdminActive();
  const toast = useToast();
  const isSelf = admin.id === me?.id;

  async function handleToggle() {
    try {
      await mutation.mutateAsync({ userId: admin.id, isActive: !admin.isActive });
      toast.success(admin.isActive ? 'Account deactivated' : 'Account activated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <tr className="hover:bg-ink-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-ink-900">
          {admin.email}
          {isSelf ? (
            <Badge tone="accent">You</Badge>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge tone={admin.isActive ? 'success' : 'neutral'}>
          {admin.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {admin.isEmailVerified ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <XCircle size={16} className="text-ink-300" aria-label="Not verified" />
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink-500">{formatDateTime(admin.createdAt)}</td>
      <td className="px-4 py-3 text-right">
        {isSelf ? (
          <span className="text-xs text-ink-400">Can&apos;t modify self</span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleToggle()}
            loading={mutation.isPending}
          >
            {admin.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </td>
    </tr>
  );
}

function CreateSuperAdminDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateSuperAdmin();
  const toast = useToast();

  function handleClose() {
    setEmail('');
    setPassword('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ email, password });
      toast.success(`Super-admin ${email} created — verification email sent`);
      handleClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add super-admin"
      description="The new super-admin will receive a verification email before they can log in."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="create-sa-form" type="submit" loading={mutation.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-sa-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}
        <Field label="Email" required htmlFor="sa-new-email">
          <Input
            id="sa-new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" required htmlFor="sa-new-password" hint="Min 8 chars, one uppercase, one digit">
          <Input
            id="sa-new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
      </form>
    </Dialog>
  );
}
