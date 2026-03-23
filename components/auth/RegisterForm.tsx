'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { registerUserAction } from '@/lib/actions/auth';

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export default function RegisterForm({ locale }: { locale: string }) {
  const commonT = useTranslations('common');
  const t = useTranslations('auth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Errors = {};

    if (!form.name.trim()) {
      nextErrors.name = t('validation.name_required');
    }
    if (!form.email.trim()) {
      nextErrors.email = t('validation.email_required');
    }
    if (!form.password.trim()) {
      nextErrors.password = t('validation.password_required');
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = t('validation.passwords_mismatch');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const result = await registerUserAction({
        ...form,
        locale
      });

      if (!result.success) {
        const field = result.field as keyof Errors;
        setErrors({ [field]: result.error });
        return;
      }

      const signInResult = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false
      });

      if (signInResult?.error) {
        router.push(`/${locale}/login`);
        return;
      }

      router.push(`/${locale}`);
      router.refresh();
    });
  };

  return (
    <AuthShell
      locale={locale}
      title={t('register.title')}
      description={t('register.description')}
      footer={
        <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
          {t('back_to_login')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">{commonT('name')}</label>
          <input
            type="text"
            className="input px-4"
            placeholder={t('placeholders.full_name')}
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label">{commonT('email')}</label>
          <input
            type="email"
            className="input px-4"
            placeholder={t('placeholders.email')}
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label">{commonT('password')}</label>
          <input
            type="password"
            className="input px-4"
            placeholder={t('placeholders.create_password')}
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
          />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>

        <div>
          <label className="label">{commonT('confirm_password')}</label>
          <input
            type="password"
            className="input px-4"
            placeholder={t('placeholders.confirm_password')}
            value={form.confirmPassword}
            onChange={(event) => handleChange('confirmPassword', event.target.value)}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
          )}
        </div>

        {errors.form && (
          <div className="alert-error">{errors.form}</div>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={isPending}>
          <span className="material-symbols-outlined">person_add</span>
          {isPending ? t('register.submitting') : t('register.submit')}
        </button>

        <p className="text-muted text-center text-sm">
          {t('register.already_have_account')}{' '}
          <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
            {t('login.submit')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
