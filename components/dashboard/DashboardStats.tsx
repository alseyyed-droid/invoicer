import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/generated/prisma/client';
import { getIntlLocale } from '@/lib/invoices';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardStats({ userId, locale }: { userId: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const intlLocale = getIntlLocale(locale);
  const latestInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: {
        in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT]
      }
    }
  });

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.OVERDUE
    }
  });

  const stats = [
    {
      title: t('recentInvoices'),
      icon: 'history',
      valuePrimary: latestInvoice?.number ?? t('no_invoices'),
      valueSecondary: formatCurrency(latestInvoice?.grandTotal ?? 0, 'USD', intlLocale),
      meta: latestInvoice?.customerName ?? t('create_first_invoice'),
      label: t('paid'),
      labelClass: 'status-paid'
    },
    {
      title: t('pendingInvoices'),
      icon: 'pending_actions',
      valuePrimary: `${pendingInvoices.length} ${t('invoices_label')}`,
      valueSecondary: formatCurrency(
        pendingInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0),
        'USD',
        intlLocale
      ),
      meta: t('awaiting_payment'),
      label: t('pending'),
      labelClass: 'status-pending'
    },
    {
      title: t('overdueInvoices'),
      icon: 'error',
      valuePrimary: `${overdueInvoices.length} ${t('invoices_label')}`,
      valueSecondary: formatCurrency(
        overdueInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0),
        'USD',
        intlLocale
      ),
      meta: t('past_due_date'),
      label: t('overdue'),
      labelClass: 'status-overdue'
    }
  ];

  return (
    <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {stats.map((card) => (
        <div key={card.title} className="stat-card">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-muted text-[12px] font-bold uppercase tracking-[0.08em]">{card.title}</h3>
            <span className="material-symbols-outlined text-soft">{card.icon}</span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[24px] font-bold leading-none text-[color:var(--text)]">{card.valuePrimary}</p>
              <p className="text-muted mt-1 text-sm">{card.meta}</p>
            </div>
            <div className="text-right">
              <p className="text-[30px] font-bold leading-none text-[color:var(--text)]">{card.valueSecondary}</p>
              <span className={`status-chip mt-2 ${card.labelClass}`}>{card.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
