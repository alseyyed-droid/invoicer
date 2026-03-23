import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceRenderContext, TemplateRenderer } from './template-types';
import { CompanyLogo, lightInvoiceThemeStyle } from './shared';

export const creativeTemplate: TemplateRenderer = {
  articleClassName: 'border-emerald-200 shadow-[0_24px_80px_rgba(5,150,105,0.08)]',
  articleStyle: {
    ...lightInvoiceThemeStyle,
    background: '#ffffff',
    color: '#111827',
    borderColor: '#a7f3d0'
  },
  render: renderCreativeTemplate
};

export function renderCreativeTemplate(context: InvoiceRenderContext) {
  const isArabic = context.intlLocale.startsWith('ar');
  const accentGradient = isArabic
    ? 'linear-gradient(270deg,#065f46 0%,#10b981 55%,#52e3a9 100%)'
    : 'linear-gradient(90deg,#065f46 0%,#10b981 55%,#52e3a9 100%)';
  const paymentLines = [
    context.companyInfo.companyName,
    context.companyInfo.companyEmail,
    context.companyInfo.address,
    context.companyLocation
  ].filter((line): line is string => Boolean(line));

  const signerName = context.companyInfo.companyName || context.t('company_placeholder');

  return (
    <div
      className="relative flex min-h-[1240px] flex-col overflow-hidden rounded-[18px] bg-white text-[#1f2937] md:px-10 md:py-10"
      style={{ zoom: 0.85 }}
    >
      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />

      <section className="relative flex flex-col items-center justify-center gap-5 text-center md:flex-row md:gap-6 md:text-left">
        <CompanyLogo
          companyInfo={context.companyInfo}
          companyInitial={context.companyInitial}
          className="h-20 w-20 rounded-[20px]"
          fallbackClassName="bg-[linear-gradient(135deg,#065f46,#10b981)] text-white"
        />

        <div>
          <h1 className="text-4xl mt-8 font-bold tracking-[-0.04em] text-[#202124] md:text-5xl">
            {context.companyInfo.companyName || context.t('company_placeholder')}
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.35em] text-[#14532d] md:text-base">
            Creative Agency
          </p>
        </div>
      </section>

      <section className="relative mt-16 grid gap-8 print:grid-cols-3 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#14532d]">
            {context.t('bill_to')}
          </p>
          <h2 className="mt-3 text-2xl font-bold uppercase text-[#1f2a44]">{context.invoice.customerName}</h2>
          <div className="mt-3 h-[3px] w-12 rounded-full bg-[#14532d]" />
          {context.invoice.customerEmail && <p className="mt-3 text-sm text-[#4b5563]">{context.invoice.customerEmail}</p>}
        </div>

        <div className="space-y-3 text-center md:pt-1">
          <p className="text-base text-[#374151]">
            <span className="font-medium">{context.t('invoice_date')}:</span> {formatDate(context.invoice.invoiceDate, context.intlLocale)}
          </p>
          <p className="text-base text-[#374151]">
            <span className="font-medium">{context.t('invoice_number')}:</span> {context.invoice.invoiceNumber}
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#14532d]">
            {context.t('grand_total')}
          </p>
          <p className="mt-3 text-3xl font-bold text-[#1f2a44] md:text-4xl">
            {formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
          </p>
        </div>
      </section>

      <section className="relative mt-10 overflow-hidden rounded-[14px] border border-emerald-100">
        <table className="w-full border-collapse text-left">
          <thead className="text-white" style={{ background: accentGradient }}>
            <tr>
              <th className="px-4 py-4 text-lg font-semibold">{context.t('description')}</th>
              <th className="px-4 py-4 text-center text-lg font-semibold">{context.t('quantity')}</th>
              <th className="px-4 py-4 text-center text-lg font-semibold">{context.t('price')}</th>
              <th className="px-4 py-4 text-right text-lg font-semibold">{context.t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {context.invoice.items.map((item, index) => (
              <tr key={`${item.id ?? item.itemName}-${index}`} className={index % 2 === 1 ? 'bg-[#f3f4f6]' : 'bg-white'}>
                <td className="px-4 py-4 text-base font-semibold text-[#202124]">
                  {item.itemName}
                  {item.unitType && <p className="mt-1 text-sm font-normal text-[#6b7280]">{item.unitType}</p>}
                </td>
                <td className="px-4 py-4 text-center text-base font-semibold text-[#202124]">{item.quantity}</td>
                <td className="px-4 py-4 text-center text-base font-semibold text-[#202124]">
                  {formatCurrency(item.price, context.currency, context.intlLocale)}
                </td>
                <td className="px-4 py-4 text-right text-base font-semibold text-[#202124]">
                  {formatCurrency(item.lineGrandTotal, context.currency, context.intlLocale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="relative mt-8 grid gap-8 border-t border-[#9ca3af] pt-6 print:grid-cols-[minmax(0,1fr)_220px] md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <p className="text-lg font-medium text-[#374151]">{context.t('payment_method')}</p>
          <div className="mt-3 space-y-1 text-base text-[#374151]">
            {paymentLines.length ? (
              paymentLines.map((line) => <p key={line}>{line}</p>)
            ) : (
              <p>{context.t('company_placeholder')}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SummaryRow
            label={context.t('subtotal')}
            value={formatCurrency(context.invoice.subtotal, context.currency, context.intlLocale)}
          />
          <SummaryRow
            label={context.t('tax_total')}
            value={formatCurrency(context.invoice.taxTotal, context.currency, context.intlLocale)}
          />
          <SummaryRow
            label={context.t('discount')}
            value={`-${formatCurrency(context.invoice.discountAmount, context.currency, context.intlLocale)}`}
          />
          <div className="mt-4 flex items-center justify-between gap-4 px-3 py-4 text-white" style={{ background: accentGradient }}>
            <span className="text-3xl font-bold tracking-[-0.03em]">{context.t('total')}:</span>
            <span className="text-3xl font-bold tracking-[-0.03em]">
              {formatCurrency(context.invoice.grandTotal, context.currency, context.intlLocale)}
            </span>
          </div>
        </div>
      </section>

      <section className="relative pt-12 mb-24 grid gap-10 print:grid-cols-[minmax(0,1fr)_220px] md:grid-cols-[minmax(0,1fr)_220px">
        <div>
          <h2 className="text-3xl font-bold text-[#111827]">
            {context.t('thank_you')}
          </h2>
          {context.invoice.notes && (
            <div
              className="mt-1 mb-2 max-w-xl text-md leading-7 text-[#4b5563]"
              dangerouslySetInnerHTML={{ __html: context.invoice.notes }}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-base font-semibold text-[#202124]">
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function CornerAccent({ position }: { position: 'top-right' | 'bottom-left' }) {
  const baseClassName =
    position === 'top-right'
      ? 'pointer-events-none absolute -right-15 -top-12 h-[12rem] w-[17rem]'
      : 'pointer-events-none absolute -bottom-10 -left-12 h-[13rem] w-[19rem]';

  const primaryClassName =
    position === 'top-right'
      ? 'absolute right-0 -top-5 w-[15rem] h-[10rem] rotate-[45deg] bg-[#047857] rounded-[20px]'
      : 'absolute -bottom-10 left-0 w-[17rem] h-[10rem] rotate-[45deg] bg-[#047857] rounded-[20px]';

  const secondaryClassName =
    position === 'top-right'
      ? 'absolute right-20 top-8 h-[4.5rem] w-[15rem] rotate-[55deg] bg-[#52e3a9] rounded-[20px]'
      : 'absolute bottom-8 left-20 h-[4.5rem] w-[13.5rem] rotate-[55deg] bg-[#52e3a9] rounded-[20px]';

  const tertiaryClassName =
    position === 'top-right'
      ? 'absolute right-39 top-5 h-[4.5rem] w-[15rem] rotate-[45deg] bg-[#34d399] rounded-[20px]'
      : 'absolute bottom-5 left-39 h-[4.5rem] w-[13.5rem] rotate-[45deg] bg-[#34d399] rounded-[20px]';

  return (
    <div className={baseClassName} aria-hidden="true">
      <div className={primaryClassName} />
      <div className={secondaryClassName} />
      <div className={tertiaryClassName} />
    </div>
  );
}
