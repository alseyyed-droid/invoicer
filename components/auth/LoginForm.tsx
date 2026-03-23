'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';

type Errors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Errors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setErrors({ form: 'Invalid email or password.' });
        return;
      }

      router.push(`/${locale}`);
      router.refresh();
    });
  };

  return (
    <AuthShell
      locale={locale}
      title="Welcome back"
      description="Sign in with your local account to access your workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input px-4"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input px-4"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>

        {errors.form && (
          <div className="alert-error">{errors.form}</div>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={isPending}>
          <span className="material-symbols-outlined">login</span>
          {isPending ? 'Signing In...' : 'Login'}
        </button>
      </form>
    </AuthShell>
  );
}
