import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceRenderContext, TemplateRenderer } from './template-types';
import {
  CompanyDetails,
  CompanyLogo,
  hasCompanyDetails,
  InvoiceItemsTable,
  MetaPanel,
  NotesCard,
  TotalsCard
} from './shared';

export const vintageTemplate: TemplateRenderer = {
  articleStyle: {
    background:
      'linear-gradient(180deg, color-mix(in srgb, #f5e7d1 62%, var(--surface)) 0%, color-mix(in srgb, #fffcf6 82%, var(--surface)) 100%)',
    color: 'color-mix(in srgb, #5b3a21 72%, var(--text))',
    borderColor: 'color-mix(in srgb, #a16207 28%, var(--border))',
    fontFamily: 'Georgia, Times New Roman, serif'
  },
  render: renderVintageTemplate
};

export function renderVintageTemplate(context: InvoiceRenderContext) {
  const showCompany = hasCompanyDetails(context.companyInfo);

  return (
    <div className="space-y-8" style={{ zoom: 0.85 }}>
      <section className="rounded-[30px] border-2 border-[color:color-mix(in_srgb,#a16207_24%,var(--border))] px-6 py-7">
        <div className="flex flex-col gap-6 border-b border-[color:color-mix(in_srgb,#a16207_18%,var(--border))] pb-6 md:flex-row md:items-end md:justify-between">
          {showCompany ? (
            <div className="flex items-start gap-4">
              <CompanyLogo
                companyInfo={context.companyInfo}
                companyInitial={context.companyInitial}
                className="h-16 w-16 rounded-full border-2 border-[rgba(126,77,36,0.4)] p-1"
                imageClassName="rounded-full"
                fallbackClassName="bg-[color:color-mix(in_srgb,#a16207_14%,var(--surface))] text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]"
              />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:color-mix(in_srgb,#5b3a21_58%,var(--text))]">
                  {context.t('invoice_document')}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[0.04em] text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]">
                  {context.companyInfo.companyName}
                </h1>
                <CompanyDetails
                  companyInfo={context.companyInfo}
                  companyLocation={context.companyLocation}
                  className="mt-4 space-y-1 text-sm text-[color:color-mix(in_srgb,#5b3a21_58%,var(--text))]"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:color-mix(in_srgb,#5b3a21_58%,var(--text))]">
                {context.t('invoice_document')}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[0.04em] text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]">
                {context.t('invoice_document')}
              </h1>
            </div>
          )}

          <div className="grid gap-3 text-right md:min-w-[280px]">
            <MetaPanel
              label={context.t('invoice_number')}
              value={context.invoice.invoiceNumber}
              className="border-b border-[color:color-mix(in_srgb,#a16207_18%,var(--border))] pb-3"
              labelClassName="text-[11px] uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]"
              valueClassName="mt-2 text-2xl font-semibold tracking-[0.06em] text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]"
            />
            <MetaPanel
              label={context.t('invoice_date')}
              value={formatDate(context.invoice.invoiceDate, context.intlLocale)}
              labelClassName="text-[11px] uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]"
              valueClassName="mt-2 text-sm font-semibold text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]"
            />
          </div>
        </div>

        <div className="grid gap-6 pt-6 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,#a16207_16%,var(--border))] bg-[color:color-mix(in_srgb,#fffbf5_72%,var(--surface))] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]">{context.t('bill_to')}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]">{context.invoice.customerName}</h2>
            {context.invoice.customerEmail && (
              <p className="mt-2 text-sm text-[color:color-mix(in_srgb,#5b3a21_58%,var(--text))]">{context.invoice.customerEmail}</p>
            )}
          </div>

          <div className="rounded-[24px] border border-[color:color-mix(in_srgb,#a16207_16%,var(--border))] bg-[color:color-mix(in_srgb,#fffbf5_72%,var(--surface))] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]">{context.t('grand_total')}</p>
            <p className="mt-3 text-3xl font-semibold text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]">
              {formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
            </p>
          </div>
        </div>
      </section>

      <InvoiceItemsTable context={context} variant="vintage" />

      <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <NotesCard
          title={context.t('notes')}
          notes={context.invoice.notes}
          emptyLabel={context.t('no_notes')}
          className="rounded-[28px] border border-[color:color-mix(in_srgb,#a16207_18%,var(--border))] bg-[color:color-mix(in_srgb,#fffbf5_72%,var(--surface))] px-5 py-5"
          titleClassName="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]"
          bodyClassName="mt-4 text-sm leading-7 text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]"
        />

        <TotalsCard
          context={context}
          variant="vintage"
          className="rounded-[28px] border border-[color:color-mix(in_srgb,#a16207_22%,var(--border))] bg-[color:color-mix(in_srgb,#fffbf5_72%,var(--surface))] px-5 py-5"
        />
      </section>
    </div>
  );
}
