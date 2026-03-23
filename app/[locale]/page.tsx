import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import DashboardStats from '@/components/dashboard/DashboardStats';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { requireAuth } from '@/auth';

export default async function DashboardPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const quickActions = [
    { icon: 'post_add', label: t('quick_actions.create_invoice'), href: '/invoices/new' },
    { icon: 'inventory_2', label: t('quick_actions.add_item'), href: '/items' },
    { icon: 'bar_chart', label: t('quick_actions.view_reports'), href: '/settings' }
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={`/${locale}${action.href}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[15px] font-semibold text-[color:var(--text)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:border-emerald-200 hover:bg-[var(--bg)] hover:text-emerald-600"
          >
            <span className="material-symbols-outlined text-emerald-500">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>

      <DashboardStats userId={session.user.id} locale={locale} />

      <InvoiceTable userId={session.user.id} locale={locale} />

      <footer className="mt-10 border-t border-[var(--border)] py-6">
        <div className="text-center">
          <p className="text-soft text-sm">
            {t('footer_note')}
          </p>
        </div>
      </footer>
    </div>
  );
}
