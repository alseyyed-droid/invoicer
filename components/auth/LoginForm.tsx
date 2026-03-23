'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';

type Errors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginForm({ locale }: { locale: string }) {
  const commonT = useTranslations('common');
  const t = useTranslations('auth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Errors = {};

    if (!email.trim()) {
      nextErrors.email = t('validation.email_required');
    }

    if (!password.trim()) {
      nextErrors.password = t('validation.password_required');
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
        setErrors({ form: t('validation.invalid_credentials') });
        return;
      }

      router.push(`/${locale}`);
      router.refresh();
    });
  };

  return (
    <AuthShell
      locale={locale}
      title={t('login.title')}
      description={t('login.description')}
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
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label">{commonT('password')}</label>
          <input
            type="password"
            className="input px-4"
            placeholder={t('placeholders.password')}
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
          {isPending ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </AuthShell>
  );
}
