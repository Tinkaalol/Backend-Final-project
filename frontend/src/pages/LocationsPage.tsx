import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CenteredSpinner } from '@/components/ui/Spinner';
import { useLocations, useCreateLocation } from '@/features/locations/hooks';
import { extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';

export function LocationsPage() {
  const { data, isLoading, isError, error, refetch } = useLocations();
  const { mutate: createLocation, isPending } = useCreateLocation();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.address.trim()) {
      setFormError('Name and address are required');
      return;
    }

    createLocation(formData, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({ name: '', address: '' });
      },
      onError: (err) => {
        setFormError(extractErrorMessage(err));
      },
    });
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          Warehouses and showrooms registered for your tenant.
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            <Plus size={16} />
            Add Location
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {formError && (
              <div className="text-sm text-red-600">{formError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Warehouse"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main St, City"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                disabled={isPending}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Location'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', address: '' });
                  setFormError('');
                }}
                className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isError ? (
        <ErrorBanner
          message={extractErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <CenteredSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<MapPin size={32} strokeWidth={1.5} />}
          title="No locations yet"
          description={isAdmin ? 'Create your first location to get started.' : 'Ask an admin to add a location.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((loc) => (
            <Card key={loc.id}>
              <CardHeader
                title={loc.name}
                description={loc.address}
                action={<Badge tone="info">Active</Badge>}
              />
              <p className="text-xs text-ink-400">ID: {loc.id}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
