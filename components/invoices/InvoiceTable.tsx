import DashboardInvoiceActions from '@/components/invoices/DashboardInvoiceActions';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/generated/prisma/client';
import {
  getIntlLocale,
  getInvoiceTaxHandlingFromTotal,
  getInvoiceTemplateId,
  type InvoiceSummaryRecord
} from '@/lib/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getStatusMeta(status: InvoiceStatus, labels: { paid: string; overdue: string; pending: string }) {
  if (status === InvoiceStatus.PAID) {
    return { label: labels.paid, className: 'status-paid' };
  }

  if (status === InvoiceStatus.OVERDUE) {
    return { label: labels.overdue, className: 'status-overdue' };
  }

  return { label: labels.pending, className: 'status-pending' };
}

export default async function InvoiceTable({
  title = 'Invoice History',
  userId,
  locale
}: {
  title?: string;
  userId: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const intlLocale = getIntlLocale(locale);
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  const resolvedTitle = title ?? t('invoice_history');
  const statusLabels = {
    paid: t('paid'),
    overdue: t('overdue'),
    pending: t('pending')
  };

  return (
    <div className="table-shell">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
        <h2 className="text-[17px] font-bold text-[color:var(--text)]">{resolvedTitle}</h2>
        <div className="flex gap-2">
          <button className="text-muted rounded-lg p-2 hover:bg-[var(--bg)]">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="text-muted rounded-lg p-2 hover:bg-[var(--bg)]">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-lg font-semibold text-[color:var(--text)]">{t('no_invoices')}</p>
          <p className="text-muted mt-2 text-sm">{t('create_first_invoice')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {t('invoice')}
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {t('customer')}
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {t('date')}
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {t('amount')}
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {t('status')}
                  </th>
                  <th className="text-muted px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em]">
                    {commonT('actions')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => {
                  const status = getStatusMeta(invoice.status, statusLabels);
                  const invoiceSummary: InvoiceSummaryRecord = {
                    id: invoice.id,
                    invoiceNumber: invoice.number,
                    invoiceDate: invoice.invoiceDate.toISOString(),
                    customerName: invoice.customerName,
                    customerEmail: invoice.customerEmail,
                    taxType: getInvoiceTaxHandlingFromTotal(invoice.taxTotal),
                    templateId: getInvoiceTemplateId(invoice.templateId),
                    discountType: invoice.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
                    discountValue: invoice.discountValue,
                    discountAmount: invoice.discountAmount,
                    notes: invoice.notes ?? '',
                    subtotal: invoice.subtotal,
                    taxTotal: invoice.taxTotal,
                    grandTotal: invoice.grandTotal,
                    status: invoice.status,
                    shareToken: invoice.shareToken ?? null,
                    createdAt: invoice.createdAt.toISOString(),
                    updatedAt: invoice.updatedAt.toISOString(),
                    items: []
                  };

                  return (
                    <tr key={invoice.id} className="transition-colors hover:bg-[var(--bg)]">
                      <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                        #{invoice.number}
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="tone-emerald flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold">
                            {getInitials(invoice.customerName)}
                          </div>
                          <span className="text-[15px] font-semibold text-[color:var(--text)]">
                            {invoice.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted px-5 py-5 text-[15px]">
                        {formatDate(invoice.invoiceDate, intlLocale)}
                      </td>
                      <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                        {formatCurrency(invoice.grandTotal, 'USD', intlLocale)}
                      </td>
                      <td className="px-5 py-5">
                        <span className={`status-chip ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <DashboardInvoiceActions
                          locale={locale}
                          invoice={invoiceSummary}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg)] px-5 py-4">
            <p className="text-muted text-[15px]">
              {t('showing_results', { shown: Math.min(invoices.length, 10), total: invoices.length })}
            </p>
            <div className="flex gap-2">
              <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[var(--bg)]">
                {t('previous')}
              </button>
              <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[var(--bg)]">
                {t('next')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
