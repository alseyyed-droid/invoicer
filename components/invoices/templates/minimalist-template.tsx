import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceRenderContext, TemplateRenderer } from './template-types';
import {
  CompanyDetails,
  CompanyLogo,
  hasCompanyDetails,
  InvoiceItemsTable,
  lightInvoiceThemeStyle,
  MetaPanel,
  NotesCard,
  SummaryStat,
  TotalsCard
} from './shared';

export const minimalistTemplate: TemplateRenderer = {
  articleStyle: {
    ...lightInvoiceThemeStyle,
    background: '#ffffff',
    color: '#1e293b',
    borderColor: '#d8dee8'
  },
  render: renderMinimalistTemplate
};

export function renderMinimalistTemplate(context: InvoiceRenderContext) {
  const showCompany = hasCompanyDetails(context.companyInfo);

  return (
    <div className="space-y-8" style={{ zoom: 0.85 }}>
      <section className="grid gap-8 border-b border-[var(--border)] pb-8 print:grid-cols-[minmax(0,1.3fr)_320px] md:grid-cols-[minmax(0,1.3fr)_320px]">
        <div>
          {showCompany ? (
            <div className="flex items-start gap-4">
              <CompanyLogo
                companyInfo={context.companyInfo}
                companyInitial={context.companyInitial}
                className="h-16 w-16 rounded-[22px]"
                fallbackClassName="border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_60%,var(--bg))] text-[color:var(--text)]"
              />

              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.28em]">
                  {context.t('invoice_document')}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">
                  {context.companyInfo.companyName}
                </h1>
                <CompanyDetails
                  companyInfo={context.companyInfo}
                  companyLocation={context.companyLocation}
                  className="text-muted mt-4 space-y-1 text-sm"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.28em]">
                {context.t('invoice_document')}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">
                {context.t('invoice_document')}
              </h1>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <MetaPanel
            label={context.t('invoice_number')}
            value={context.invoice.invoiceNumber}
            className="rounded-[26px] border border-[var(--border)] bg-[var(--bg)] px-5 py-4"
            labelClassName="text-muted text-[11px] uppercase tracking-[0.2em]"
            valueClassName="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--text)]"
          />
          <div className="grid grid-cols-2 gap-4">
            <MetaPanel
              label={context.t('invoice_date')}
              value={formatDate(context.invoice.invoiceDate, context.intlLocale)}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
              labelClassName="text-muted text-[11px] uppercase tracking-[0.18em]"
              valueClassName="mt-2 text-sm font-semibold text-[color:var(--text)]"
            />
            <MetaPanel
              label={context.t('grand_total')}
              value={formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
              className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_60%,var(--bg))] px-4 py-4"
              labelClassName="text-muted text-[11px] uppercase tracking-[0.18em]"
              valueClassName="mt-2 text-sm font-semibold text-[color:var(--text)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 print:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
          <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.2em]">{context.t('bill_to')}</p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text)]">{context.invoice.customerName}</h2>
          {context.invoice.customerEmail && <p className="text-muted mt-2 text-sm">{context.invoice.customerEmail}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SummaryStat
            label={context.t('subtotal')}
            value={formatCurrency(context.invoice.subtotal, context.currency, context.intlLocale)}
          />
          <SummaryStat
            label={context.t('discount')}
            value={`-${formatCurrency(context.invoice.discountAmount, context.currency, context.intlLocale)}`}
          />
        </div>
      </section>

      <InvoiceItemsTable context={context} variant="minimalist" />

      <section className="grid gap-6 border-t border-[var(--border)] pt-8 print:grid-cols-[minmax(0,1fr)_320px] md:grid-cols-[minmax(0,1fr)_320px]">
        <NotesCard
          title={context.t('notes')}
          notes={context.invoice.notes}
          emptyLabel={context.t('no_notes')}
          className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] px-5 py-5"
          titleClassName="text-muted text-[11px] font-semibold uppercase tracking-[0.2em]"
          bodyClassName="mt-4 text-sm leading-7 text-[color:var(--text)]"
        />

        <TotalsCard
          context={context}
          variant="minimalist"
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5"
        />
      </section>
    </div>
  );
}
