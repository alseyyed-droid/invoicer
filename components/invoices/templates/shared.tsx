import type { CSSProperties } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import type { InvoiceCompanyInfo, InvoiceTemplateId } from '@/lib/invoices';
import type { InvoiceRenderContext } from './template-types';

type InvoiceThemeStyle = CSSProperties & {
  '--bg': string;
  '--surface': string;
  '--border': string;
  '--text': string;
};

export const lightInvoiceThemeStyle: InvoiceThemeStyle = {
  '--bg': '#f7f8fb',
  '--surface': '#ffffff',
  '--border': '#d8dee8',
  '--text': '#1e293b',
  colorScheme: 'light'
};

export function hasCompanyDetails(companyInfo: InvoiceCompanyInfo) {
  return Boolean(
    companyInfo.companyName ||
      companyInfo.companyEmail ||
      companyInfo.address ||
      companyInfo.city ||
      companyInfo.country ||
      companyInfo.postalCode ||
      companyInfo.companyLogo
  );
}

export function CompanyLogo({
  companyInfo,
  companyInitial,
  className,
  imageClassName,
  fallbackClassName
}: {
  companyInfo: InvoiceCompanyInfo;
  companyInitial: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}) {
  if (!hasCompanyDetails(companyInfo)) {
    return null;
  }

  if (companyInfo.companyLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={companyInfo.companyLogo}
        alt={companyInfo.companyName ?? 'Company logo'}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className={cn('object-cover', className, imageClassName)}
      />
    );
  }

  return (
    <div className={cn('flex items-center justify-center text-xl font-bold', className, fallbackClassName)}>
      {companyInitial}
    </div>
  );
}

export function CompanyDetails({
  companyInfo,
  companyLocation,
  className
}: {
  companyInfo: InvoiceCompanyInfo;
  companyLocation: string;
  className?: string;
}) {
  const lines = [companyInfo.companyEmail, companyInfo.address, companyLocation].filter(
    (line): line is string => Boolean(line)
  );

  if (!lines.length) {
    return null;
  }

  return (
    <div className={className}>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export function MetaPanel({
  label,
  value,
  className,
  labelClassName,
  valueClassName
}: {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <p className={labelClassName}>{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}

export function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg)] px-4 py-4">
      <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[color:var(--text)]">{value}</p>
    </div>
  );
}

export function CorporateSummaryBlock({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border px-4 py-4',
        accent
          ? 'border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_56%,var(--bg))] text-[color:var(--text)]'
          : 'border-[var(--border)] bg-[var(--bg)] text-[color:var(--text)]'
      )}
    >
      <p
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.18em]',
          accent ? 'text-soft' : 'text-muted'
        )}
      >
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}

export function CreativeMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_6%,transparent)] px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function CreativeSummaryCard({
  label,
  value,
  accentClassName
}: {
  label: string;
  value: string;
  accentClassName: string;
}) {
  return (
    <div className={cn('rounded-[24px] border px-4 py-4', accentClassName)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

export function ModernMetricCard({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[24px] border px-4 py-4',
        accent
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
          : 'border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_8%,transparent)] text-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]'
      )}
    >
      <p
        className={cn(
          'font-mono text-[11px] uppercase tracking-[0.2em]',
          accent
            ? 'text-emerald-200/70'
            : 'text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]'
        )}
      >
        {label}
      </p>
      <p className="mt-3 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

export function InvoiceItemsTable({
  context,
  variant
}: {
  context: InvoiceRenderContext;
  variant: InvoiceTemplateId;
}) {
  const { invoice, currency, intlLocale, t } = context;

  if (variant === 'creative') {
    return (
      <section className="grid gap-4 md:grid-cols-2">
        {invoice.items.map((item, index) => (
          <article
            key={`${item.id ?? item.itemName}-${index}`}
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {t('item')} {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[color:var(--text)]">{item.itemName}</h3>
                {item.unitType && <p className="text-muted mt-2 text-sm">{item.unitType}</p>}
              </div>

              <div className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_60%,var(--bg))] px-4 py-2 text-sm font-semibold text-[color:var(--text)]">
                {formatCurrency(item.lineGrandTotal, currency, intlLocale)}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <CreativeSummaryCard
                label={t('price')}
                value={formatCurrency(item.price, currency, intlLocale)}
                accentClassName="border-[var(--border)] bg-[var(--bg)] text-[color:var(--text)]"
              />
              <CreativeSummaryCard
                label={t('quantity')}
                value={String(item.quantity)}
                accentClassName="border-teal-200 bg-teal-50 text-teal-900"
              />
            </div>
          </article>
        ))}
      </section>
    );
  }

  if (variant === 'modern') {
    return (
      <section className="overflow-hidden rounded-[30px] border border-[color:color-mix(in_srgb,var(--surface)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_5%,transparent)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-[color:color-mix(in_srgb,var(--surface)_8%,transparent)]">
              <tr>
                {['item', 'price', 'quantity', 'total'].map((key) => (
                  <th
                    key={key}
                    className="px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]"
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr
                  key={`${item.id ?? item.itemName}-${index}`}
                  className={index % 2 === 0 ? 'bg-[color:color-mix(in_srgb,var(--surface)_2%,transparent)]' : 'bg-transparent'}
                >
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-white">{item.itemName}</p>
                    {item.unitType && (
                      <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]">
                        {item.unitType}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-sm text-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]">
                    {formatCurrency(item.price, currency, intlLocale)}
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-sm text-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-4 align-top font-mono text-sm font-semibold text-emerald-300">
                    {formatCurrency(item.lineGrandTotal, currency, intlLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const tableShellClassName =
    variant === 'corporate'
      ? 'rounded-[30px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_36px_rgba(15,23,42,0.06)]'
      : variant === 'vintage'
        ? 'rounded-[30px] border border-[color:color-mix(in_srgb,#a16207_18%,var(--border))] bg-[color:color-mix(in_srgb,#fffbf5_72%,var(--surface))]'
        : 'rounded-[30px] border border-[var(--border)] bg-[var(--surface)]';

  const headClassName =
    variant === 'corporate'
      ? 'border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_56%,var(--bg))] text-[color:var(--text)]'
      : variant === 'vintage'
        ? 'border-b border-[color:color-mix(in_srgb,#a16207_18%,var(--border))] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]'
        : 'border-b border-[var(--border)] text-muted';

  const cellClassName =
    variant === 'vintage'
      ? ' text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]'
      : ' text-[color:var(--text)]';

  const tableWrapperClassName = variant === 'minimalist' ? 'overflow-hidden' : 'overflow-x-auto';

  const tableClassName =
    variant === 'minimalist'
      ? 'w-full text-left text-sm'
      : 'w-full min-w-[700px] text-left text-sm';

  const headerCellClassName =
    variant === 'minimalist'
      ? 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]'
      : 'px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]';

  const bodyCellClassName = variant === 'minimalist' ? 'px-4 py-3 align-top' : 'px-5 py-4 align-top';

  const unitTypeClassName =
    variant === 'vintage'
      ? 'text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]'
      : 'text-muted';

  return (
    <section className={tableShellClassName}>
      <div className={tableWrapperClassName}>
        <table className={tableClassName}>
          <thead className={headClassName}>
            <tr>
              {['item', 'price', 'quantity', 'total'].map((key) => (
                <th
                  key={key}
                  className={cn(
                    headerCellClassName,
                    variant === 'corporate' ? 'text-muted' : undefined
                  )}
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={`${item.id ?? item.itemName}-${index}`}>
                <td className={cn(bodyCellClassName, cellClassName)}>
                  <p className="font-semibold">{item.itemName}</p>
                  {item.unitType && (
                    <p
                      className={cn(
                        'mt-1 text-xs',
                        unitTypeClassName
                      )}
                    >
                      {item.unitType}
                    </p>
                  )}
                </td>
                <td className={cn(bodyCellClassName, cellClassName)}>
                  {formatCurrency(item.price, currency, intlLocale)}
                </td>
                <td className={cn(bodyCellClassName, cellClassName)}>{item.quantity}</td>
                <td className={cn(bodyCellClassName, 'font-semibold', cellClassName)}>
                  {formatCurrency(item.lineGrandTotal, currency, intlLocale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function NotesCard({
  title,
  notes,
  emptyLabel,
  className,
  titleClassName,
  bodyClassName
}: {
  title: string;
  notes?: string;
  emptyLabel: string;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={className}>
      <p className={titleClassName}>{title}</p>
      {notes ? (
        <div className={bodyClassName} dangerouslySetInnerHTML={{ __html: notes }} />
      ) : (
        <p className={bodyClassName}>{emptyLabel}</p>
      )}
    </div>
  );
}

export function TotalsCard({
  context,
  variant,
  className
}: {
  context: InvoiceRenderContext;
  variant: InvoiceTemplateId;
  className?: string;
}) {
  const { invoice, currency, intlLocale, t } = context;

  const labelClassName =
    variant === 'modern'
      ? 'font-mono text-[11px] uppercase tracking-[0.2em] text-[color:color-mix(in_srgb,var(--surface)_55%,transparent)]'
      : variant === 'vintage'
        ? 'text-[11px] uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,#5b3a21_52%,var(--text))]'
        : variant === 'creative'
          ? 'text-[11px] uppercase tracking-[0.18em] text-white/60'
          : 'text-muted text-[11px] uppercase tracking-[0.18em]';

  const valueClassName =
    variant === 'modern'
      ? 'font-mono text-sm text-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]'
      : variant === 'vintage'
        ? 'text-sm text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]'
        : 'text-sm text-[color:var(--text)]';

  const totalBorderClassName =
    variant === 'modern'
      ? 'border-emerald-400/20'
      : variant === 'vintage'
        ? 'border-[color:color-mix(in_srgb,#a16207_18%,var(--border))]'
        : 'border-[var(--border)]';

  const totalValueClassName =
    variant === 'modern'
      ? 'font-mono text-lg text-emerald-300'
      : variant === 'vintage'
        ? 'text-lg text-[color:color-mix(in_srgb,#5b3a21_72%,var(--text))]'
        : 'text-lg';

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className={labelClassName}>{t('subtotal')}</span>
          <span className={valueClassName}>{formatCurrency(invoice.subtotal, currency, intlLocale)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className={labelClassName}>{t('discount')}</span>
          <span className={valueClassName}>-{formatCurrency(invoice.discountAmount, currency, intlLocale)}</span>
        </div>
        <div className={cn('flex items-center justify-between gap-4 border-t pt-4', totalBorderClassName)}>
          <span className={cn(labelClassName, 'font-semibold')}>{t('grand_total')}</span>
          <span className={cn(valueClassName, totalValueClassName, 'font-semibold')}>
            {formatCurrency(invoice.grandTotal, currency, intlLocale)}
          </span>
        </div>
      </div>
    </div>
  );
}
