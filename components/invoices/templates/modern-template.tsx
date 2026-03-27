import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceRenderContext, TemplateRenderer } from './template-types';
import {
  CompanyDetails,
  CompanyLogo,
  hasCompanyDetails,
  InvoiceItemsTable,
  MetaPanel,
  ModernMetricCard,
  NotesCard,
  TotalsCard
} from './shared';

export const modernTemplate: TemplateRenderer = {
  articleStyle: {
    background:
      'radial-gradient(circle at top right, color-mix(in srgb, #10b981 22%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--text) 84%, #020617) 0%, color-mix(in srgb, var(--text) 90%, #020617) 100%)',
    color: 'color-mix(in srgb, var(--surface) 88%, transparent)',
    borderColor: 'rgba(148, 163, 184, 0.22)'
  },
  render: renderModernTemplate
};

export function renderModernTemplate(context: InvoiceRenderContext) {
  const showCompany = hasCompanyDetails(context.companyInfo);

  return (
    <div className="space-y-8" style={{ zoom: 0.85 }}>
      <section className="rounded-[32px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_5%,transparent)] px-6 py-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-sm">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_300px] md:items-start">
          <div>
            {showCompany ? (
              <div className="flex items-start gap-4">
                <CompanyLogo
                  companyInfo={context.companyInfo}
                  companyInitial={context.companyInitial}
                  className="h-16 w-16 rounded-[24px] ring-1 ring-emerald-400/30"
                  fallbackClassName="bg-emerald-400 text-slate-950"
                />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                    {context.t('invoice_document')}
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                    {context.companyInfo.companyName}
                  </h1>
                  <CompanyDetails
                    companyInfo={context.companyInfo}
                    companyLocation={context.companyLocation}
                    className="mt-4 space-y-1 text-sm text-[color:color-mix(in_srgb,var(--surface)_72%,transparent)]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  {context.t('invoice_document')}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                  {context.t('invoice_document')}
                </h1>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <MetaPanel
              label={context.t('invoice_number')}
              value={context.invoice.invoiceNumber}
              className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_8%,transparent)] px-5 py-4"
              labelClassName="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]"
              valueClassName="mt-2 font-mono text-2xl font-semibold text-white"
            />
            <MetaPanel
              label={context.t('invoice_date')}
              value={formatDate(context.invoice.invoiceDate, context.intlLocale)}
              className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_8%,transparent)] px-5 py-4"
              labelClassName="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]"
              valueClassName="mt-2 font-mono text-sm font-semibold text-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_5%,transparent)] px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]">{context.t('bill_to')}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{context.invoice.customerName}</h2>
          {context.invoice.customerEmail && (
            <p className="mt-2 text-sm text-[color:color-mix(in_srgb,var(--surface)_72%,transparent)]">
              {context.invoice.customerEmail}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ModernMetricCard
            label={context.t('subtotal')}
            value={formatCurrency(context.invoice.subtotal, context.currency, context.intlLocale)}
          />
          <ModernMetricCard
            label={context.t('discount')}
            value={`-${formatCurrency(context.invoice.discountAmount, context.currency, context.intlLocale)}`}
          />
          <ModernMetricCard
            label={context.t('grand_total')}
            value={formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
            accent
          />
        </div>
      </section>

      <InvoiceItemsTable context={context} variant="modern" />

      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <NotesCard
          title={context.t('notes')}
          notes={context.invoice.notes}
          emptyLabel={context.t('no_notes')}
          className="rounded-[28px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_5%,transparent)] px-5 py-5"
          titleClassName="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]"
          bodyClassName="mt-4 text-sm leading-7 text-[color:color-mix(in_srgb,var(--surface)_72%,transparent)]"
        />

        <TotalsCard
          context={context}
          variant="modern"
          className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(2,6,23,0.92)_100%)] px-5 py-5"
        />
      </section>
    </div>
  );
}
