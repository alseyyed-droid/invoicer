import type { ReactNode } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceRenderContext, TemplateRenderer } from './template-types';
import { CompanyLogo, lightInvoiceThemeStyle } from './shared';

const MIN_TABLE_ROWS = 7;

export const corporateTemplate: TemplateRenderer = {
  articleClassName: 'rounded-[18px] border-[#d2d5db] shadow-none md:p-10',
  articleStyle: {
    ...lightInvoiceThemeStyle,
    background: '#ffffff',
    color: '#171717',
    borderColor: '#d2d5db',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  render: renderCorporateTemplate
};

export function renderCorporateTemplate(context: InvoiceRenderContext) {
  const paymentLines = [
    context.companyInfo.companyName,
    context.companyInfo.companyEmail,
    context.companyInfo.address,
    context.companyLocation
  ].filter((line): line is string => Boolean(line));

  const contactLines = [
    context.companyInfo.companyEmail,
    context.companyInfo.address,
    context.companyLocation
  ].filter((line): line is string => Boolean(line));

  const tableRows = Math.max(MIN_TABLE_ROWS, context.invoice.items.length);

  return (
    <div className="space-y-10 text-[16px] leading-relaxed text-[#222]" style={{ zoom: 0.85 }}>
      <section className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-[36px] font-bold uppercase tracking-[0.03em] text-black sm:text-[44px]">
            {context.t('invoice_document')}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[18px] font-semibold uppercase tracking-[0.03em] text-[#2b2b2b]">
              {context.companyInfo.companyName || context.t('company_placeholder')}
            </p>
          </div>
          <CompanyLogo
            companyInfo={context.companyInfo}
            companyInitial={context.companyInitial}
            className="h-10 w-10 rounded-full border border-[#d2d5db]"
            imageClassName="rounded-full"
            fallbackClassName="bg-white text-sm font-semibold text-[#222]"
          />
        </div>
      </section>

      <section className="grid gap-x-12 gap-y-6 print:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:grid-rows-[auto_auto_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[auto_auto_auto]">
        <div className="print:col-start-1 print:row-start-1 md:col-start-1 md:row-start-1">
          <LinedField label={`${context.t('invoice_date')}:`} value={formatDate(context.invoice.invoiceDate, context.intlLocale)} />
        </div>

        <div className="print:col-start-1 print:row-start-2 md:col-start-1 md:row-start-2">
          <LinedField label={`${context.t('invoice_number')}:`} value={context.invoice.invoiceNumber} />
        </div>

        <div className="print:col-start-1 print:row-start-3 md:col-start-1 md:row-start-3">
          <p className="text-[17px] text-[#2d2d2d]">{context.t('bill_to')}:</p>
          <div className="mt-4 h-px w-full max-w-[170px] bg-[#777]" />
          <div className="mt-3 space-y-1">
            <p className="font-medium text-[#1c1c1c]">{context.invoice.customerName}</p>
            {context.invoice.customerEmail && <p className="text-[#3d3d3d]">{context.invoice.customerEmail}</p>}
          </div>
        </div>

        <div className="print:col-start-2 print:row-start-2 print:row-span-2 md:col-start-2 md:row-start-2 md:row-span-2">
          <p className="text-[17px] text-[#2d2d2d]">{context.t('payment_method')}:</p>
          <div className="mt-3 space-y-1 text-[#3a3a3a]">
            {paymentLines.length ? (
              paymentLines.map((line) => <p key={line}>{line}</p>)
            ) : (
              <p>{context.t('company_placeholder')}</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden border border-[#a8aaae]">
          <table className="w-full border-collapse text-left text-[15px] text-[#2b2b2b]">
            <thead className="bg-[#f5f2f1]">
              <tr>
                <LedgerHead className="w-[14%]">{context.t('invoice_date')}</LedgerHead>
                <LedgerHead className="w-[40%]">{context.t('description')}</LedgerHead>
                <LedgerHead className="w-[18%]">{context.t('price')}</LedgerHead>
                <LedgerHead className="w-[10%]">{context.t('quantity')}</LedgerHead>
                <LedgerHead className="w-[18%]">{context.t('total')}</LedgerHead>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tableRows }).map((_, index) => {
                const item = context.invoice.items[index];

                return (
                  <tr key={item ? `${item.id ?? item.itemName}-${index}` : `empty-${index}`}>
                    <LedgerCell>{item ? formatDate(context.invoice.invoiceDate, context.intlLocale) : null}</LedgerCell>
                    <LedgerCell>
                      {item ? (
                        <div>
                          <p>{item.itemName}</p>
                          {item.unitType && <p className="mt-1 text-[13px] text-[#676767]">{item.unitType}</p>}
                        </div>
                      ) : null}
                    </LedgerCell>
                    <LedgerCell>{item ? formatCurrency(item.price, context.currency, context.intlLocale) : null}</LedgerCell>
                    <LedgerCell>{item ? item.quantity : null}</LedgerCell>
                    <LedgerCell>{item ? formatCurrency(item.lineGrandTotal, context.currency, context.intlLocale) : null}</LedgerCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-10 print:grid-cols-[minmax(0,1fr)_220px] print:items-end md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
        <div>
          <h2 className="text-[32px] font-normal uppercase tracking-[0.02em] text-[#1f1f1f]">
            {context.t('thank_you')}
          </h2>

          <div className="mt-12 space-y-2 text-[14px] text-[#434343]">
            {contactLines.length ? (
              contactLines.map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#5c5c5c]" />
                  <span>{line}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#5c5c5c]" />
                <span>{context.companyInfo.companyName || context.t('company_placeholder')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <div className="border border-[#9fa3a8] bg-[#f5f2f1] px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-[15px] text-[#2a2a2a]">
              <span>{context.t('grand_total')}:</span>
              <span className="font-semibold">
                {formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-px bg-[#7f7f7f]" />
            <div className="h-px bg-[#7f7f7f]" />
            <div className="h-px bg-[#7f7f7f]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function LinedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="max-w-[170px] space-y-2">
      <p className="text-[17px] text-[#2d2d2d]">{label}</p>
      <div className="border-b border-[#777] pb-2 text-[17px] text-[#1d1d1d]">{value}</div>
    </div>
  );
}

function LedgerHead({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <th className={`border border-[#a8aaae] px-3 py-3 text-center text-[15px] font-normal ${className ?? ''}`}>
      {children}
    </th>
  );
}

function LedgerCell({ children }: { children: ReactNode }) {
  return <td className="h-[48px] border border-[#a8aaae] px-3 py-3 align-top">{children}</td>;
}
