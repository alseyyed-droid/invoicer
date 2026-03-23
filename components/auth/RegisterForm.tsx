'use client';

import { useState, useTransition } from 'react';
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
      nextErrors.name = 'Name is required.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!form.password.trim()) {
      nextErrors.password = 'Password is required.';
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
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
      title="Create your account"
      description="Start managing invoices, items, and settings from one workspace."
      footer={
        <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            className="input px-4"
            placeholder="Your full name"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input px-4"
            placeholder="name@company.com"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input px-4"
            placeholder="Create a password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
          />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password"
            className="input px-4"
            placeholder="Confirm your password"
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
          {isPending ? 'Creating Account...' : 'Register'}
        </button>

        <p className="text-muted text-center text-sm">
          Already have an account?{' '}
          <Link href={`/${locale}/login`} className="font-semibold text-emerald-600 hover:text-emerald-700">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
