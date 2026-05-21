import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Coffee, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from './AuthContext';
import { extractErrorMessage } from '@/lib/api';
import { api } from '@/lib/api';

export function SignUpPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/inventory" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        email,
        password,
        fullName,
      });
      navigate('/login', {
        replace: true,
        state: { message: 'Registration successful! Please verify your email and log in.' }
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-pop">
            <Coffee size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">LeanStock</h1>
          <p className="text-sm text-ink-500">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-ink-200/70 bg-white p-6 shadow-card"
        >
          {error ? <ErrorBanner message={error} /> : null}

          <Field label="Full Name" htmlFor="fullName" required>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              leadingIcon={<User size={16} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </Field>

          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              leadingIcon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              leadingIcon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" loading={submitting} className="w-full">
            Sign up
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
