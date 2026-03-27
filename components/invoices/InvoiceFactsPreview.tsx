'use client';

import { useTranslations } from 'next-intl';
import type { InvoiceCompanyInfo, InvoicePreviewData } from '@/lib/invoices';
import { getIntlLocale } from '@/lib/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';

type InvoiceFactsPreviewProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoicePreviewData;
};

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--text)]">{value}</p>
    </div>
  );
}

export default function InvoiceFactsPreview({
  locale,
  currency,
  companyInfo,
  invoice
}: InvoiceFactsPreviewProps) {
  void companyInfo;
  const t = useTranslations('invoices');
  const intlLocale = getIntlLocale(locale);
  const customerEmail = invoice.customerEmail?.trim() || '-';
  const discountValue =
    invoice.discountType === 'percentage'
      ? `${invoice.discountValue}%`
      : formatCurrency(invoice.discountValue, currency, intlLocale);

  return (
    <article className="mx-auto max-w-5xl rounded-[32px] bg-[var(--surface)] p-5 md:p-8">
      <section>
        <div className="mb-4">
          <h4 className="text-lg font-bold text-[color:var(--text)]">{t('invoice_document')}</h4>
          <p className="mt-1 text-sm text-muted">{t('preview_description')}</p>
        </div>

        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label={t('invoice_number')} value={invoice.invoiceNumber} />
          <DetailItem label={t('invoice_date')} value={formatDate(invoice.invoiceDate, intlLocale)} />
          <DetailItem label={t('customer_name')} value={invoice.customerName} />
          <DetailItem label={t('customer_email')} value={customerEmail} />
          <DetailItem label={t('discount_type')} value={t(`discount_types.${invoice.discountType}`)} />
          <DetailItem label={t('discount_value')} value={discountValue} />
        </div>
      </section>

      <section className="mt-8">
        <h4 className="text-lg font-bold text-[color:var(--text)]">{t('invoice_items')}</h4>
        <div className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  {['item', 'unit_type', 'price', 'quantity', 'total'].map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
                    >
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoice.items.map((item, index) => (
                  <tr key={`${item.id ?? item.itemName}-${index}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-[color:var(--text)]">{item.itemName}</td>
                    <td className="px-4 py-3 text-sm text-muted">{item.unitType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[color:var(--text)]">
                      {formatCurrency(item.price, currency, intlLocale)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[color:var(--text)]">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[color:var(--text)]">
                      {formatCurrency(item.lineGrandTotal, currency, intlLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <h4 className="text-lg font-bold text-[color:var(--text)]">{t('notes')}</h4>
          {invoice.notes ? (
            <div
              className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--text)]"
              dangerouslySetInnerHTML={{ __html: invoice.notes }}
            />
          ) : (
            <p className="mt-4 text-sm text-muted">{t('no_notes')}</p>
          )}
        </div>

        <div>
          <h4 className="text-lg font-bold text-[color:var(--text)]">{t('summary')}</h4>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted">{t('subtotal')}</span>
              <span className="font-semibold text-[color:var(--text)]">
                {formatCurrency(invoice.subtotal, currency, intlLocale)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted">{t('discount')}</span>
              <span className="font-semibold text-[color:var(--text)]">
                -{formatCurrency(invoice.discountAmount, currency, intlLocale)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
              <span className="text-sm font-semibold text-[color:var(--text)]">{t('grand_total')}</span>
              <span className="text-lg font-bold text-[color:var(--text)]">
                {formatCurrency(invoice.grandTotal, currency, intlLocale)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
