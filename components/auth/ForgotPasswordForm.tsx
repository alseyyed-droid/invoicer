'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { requestPasswordResetAction } from '@/lib/actions/auth';

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const commonT = useTranslations('common');
  const t = useTranslations('auth');
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
      title={t('forgot_password.title')}
      description={t('forgot_password.description')}
      footer={
        <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
          {t('back_to_login')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">{commonT('email')}</label>
          <input
            type="email"
            className="input px-4"
            placeholder={t('placeholders.email')}
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
          {isPending ? t('forgot_password.submitting') : t('forgot_password.submit')}
        </button>
      </form>
    </AuthShell>
  );
}
