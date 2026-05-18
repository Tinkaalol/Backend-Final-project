import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Coffee, Key, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/features/auth/AuthContext';
import { setupSuperAdmin } from '@/features/superadmin/api';
import { extractErrorMessage } from '@/lib/api';

export function SetupPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isAuthenticated && user?.role === 'SUPERADMIN') {
    return <Navigate to="/superadmin/tenants" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await setupSuperAdmin(email, password, setupKey);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-pop">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Coffee size={22} className="text-emerald-700" />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">Account created!</h2>
          <p className="mt-2 text-sm text-ink-600">
            Check <strong>{email}</strong> for a verification link. Once verified, you can sign in.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-pop">
            <Coffee size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-white">Super Admin Setup</h1>
          <p className="text-sm text-white/50">One-time bootstrap. Requires the setup key.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-white p-6 shadow-pop"
        >
          {error ? <ErrorBanner message={error} /> : null}

          <Field label="Email" htmlFor="sa-email" required>
            <Input
              id="sa-email"
              type="email"
              autoComplete="email"
              required
              leadingIcon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </Field>

          <Field
            label="Password"
            htmlFor="sa-password"
            required
            hint="Min 8 chars, one uppercase, one digit"
          >
            <Input
              id="sa-password"
              type="password"
              required
              leadingIcon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Setup key" htmlFor="sa-key" required>
            <Input
              id="sa-key"
              type="password"
              required
              leadingIcon={<Key size={16} />}
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="From SUPERADMIN_SETUP_KEY in .env"
            />
          </Field>

          <Button type="submit" loading={submitting} className="w-full">
            Create super admin
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-white/30">
          Already have an account?{' '}
          <button
            type="button"
            className="underline hover:text-white/60"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
