'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { requestPasswordResetAction } from '@/lib/actions/auth';

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await requestPasswordResetAction({ email });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
    });
  };

  return (
    <AuthShell
      locale={locale}
      title="Reset your password"
      description="Enter your email address and we will prepare a password reset request."
      footer={
        <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
          Back to login
        </Link>
      }
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
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>

        {message && (
          <div className="alert-success">{message}</div>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={isPending}>
          <span className="material-symbols-outlined">lock_reset</span>
          {isPending ? 'Submitting...' : 'Reset Password'}
        </button>
      </form>
    </AuthShell>
  );
}
