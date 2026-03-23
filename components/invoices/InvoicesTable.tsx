'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  getIntlLocale,
  getInvoiceStatusClassName,
  getInvoiceStatusKey,
  type InvoiceSummaryRecord
} from '@/lib/invoices';

type InvoicesTableProps = {
  locale: string;
  currency: string;
  invoices: InvoiceSummaryRecord[];
  onDelete: (invoice: InvoiceSummaryRecord) => void;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function InvoicesTable({
  locale,
  currency,
  invoices,
  onDelete
}: InvoicesTableProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const intlLocale = getIntlLocale(locale);

  return (
    <div className="table-shell">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
              <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                {t('invoice_number')}
              </th>
              <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                {t('customer')}
              </th>
              <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                {t('invoice_date')}
              </th>
              <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                {t('total')}
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
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="transition-colors hover:bg-[var(--bg)]">
                <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="tone-emerald flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold">
                      {getInitials(invoice.customerName)}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[color:var(--text)]">
                        {invoice.customerName}
                      </p>
                      {invoice.customerEmail && (
                        <p className="text-muted text-xs">{invoice.customerEmail}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-muted px-5 py-5 text-[15px]">
                  {formatDate(invoice.invoiceDate, intlLocale)}
                </td>
                <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                  {formatCurrency(invoice.grandTotal, currency, intlLocale)}
                </td>
                <td className="px-5 py-5">
                  <span className={`status-chip ${getInvoiceStatusClassName(invoice.status)}`}>
                    {t(getInvoiceStatusKey(invoice.status))}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <div className="flex justify-end gap-2">
                    <Link href={`/${locale}/invoices/${invoice.id}`} className="btn btn-ghost h-9 px-3">
                      {t('view')}
                    </Link>
                    <Link href={`/${locale}/invoices/${invoice.id}/edit`} className="btn btn-secondary h-9 px-3">
                      {commonT('edit')}
                    </Link>
                    <Link href={`/${locale}/invoices/${invoice.id}/clone`} className="btn btn-secondary h-9 px-3">
                      {t('clone')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(invoice)}
                      className="btn h-9 bg-rose-600 px-3 text-white hover:bg-rose-700"
                    >
                      {commonT('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">
                  {t('invoice_number')}
                </p>
                <h3 className="mt-1 text-lg font-bold">{invoice.invoiceNumber}</h3>
              </div>
              <span className={`status-chip ${getInvoiceStatusClassName(invoice.status)}`}>
                {t(getInvoiceStatusKey(invoice.status))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="surface-inset rounded-2xl p-3">
                <p className="text-muted text-xs">{t('customer')}</p>
                <p className="mt-1 font-semibold text-[color:var(--text)]">{invoice.customerName}</p>
              </div>
              <div className="surface-inset rounded-2xl p-3">
                <p className="text-muted text-xs">{t('invoice_date')}</p>
                <p className="mt-1 font-semibold text-[color:var(--text)]">
                  {formatDate(invoice.invoiceDate, intlLocale)}
                </p>
              </div>
              <div className="surface-inset rounded-2xl p-3">
                <p className="text-muted text-xs">{t('total')}</p>
                <p className="mt-1 font-semibold text-[color:var(--text)]">
                  {formatCurrency(invoice.grandTotal, currency, intlLocale)}
                </p>
              </div>
              <div className="surface-inset rounded-2xl p-3">
                <p className="text-muted text-xs">{commonT('actions')}</p>
                <p className="mt-1 text-xs text-[color:var(--text)]">{t('manage_invoice')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/invoices/${invoice.id}`} className="btn btn-ghost flex-1">
                {t('view')}
              </Link>
              <Link href={`/${locale}/invoices/${invoice.id}/edit`} className="btn btn-secondary flex-1">
                {commonT('edit')}
              </Link>
              <Link href={`/${locale}/invoices/${invoice.id}/clone`} className="btn btn-secondary flex-1">
                {t('clone')}
              </Link>
              <button
                type="button"
                onClick={() => onDelete(invoice)}
                className="btn flex-1 bg-rose-600 text-white hover:bg-rose-700"
              >
                {commonT('delete')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
