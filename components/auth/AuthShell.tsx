import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function AuthShell({
  locale,
  title,
  description,
  footer,
  children
}: {
  locale: string;
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-300">InvoiceGen</p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              {t('shell.hero_title')}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              {t('shell.hero_description')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">42</p>
              <p className="text-xs text-slate-300">{t('shell.stats.invoices_issued')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">$4.8k</p>
              <p className="text-xs text-slate-300">{t('shell.stats.pending_revenue')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-slate-300">{t('shell.stats.overdue_alerts')}</p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white lg:hidden">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[color:var(--text)]">{title}</h2>
              <p className="text-muted mt-2 text-sm">{description}</p>
            </div>

            {children}

            <div className="text-muted mt-6 flex items-center justify-between text-sm">
              <span>{t('shell.demo_user_notice')}</span>
              {footer ?? (
                <Link
                  href={`/${locale}/login`}
                  className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  {t('back_to_login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
