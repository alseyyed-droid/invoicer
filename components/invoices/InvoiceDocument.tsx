'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getIntlLocale, type InvoiceTemplateId } from '@/lib/invoices';
import { corporateTemplate } from '@/components/invoices/templates/corporate-template';
import { creativeTemplate } from '@/components/invoices/templates/creative-template';
import { minimalistTemplate } from '@/components/invoices/templates/minimalist-template';
import { modernTemplate } from '@/components/invoices/templates/modern-template';
import { vintageTemplate } from '@/components/invoices/templates/vintage-template';
import type { InvoiceDocumentProps, InvoiceRenderContext, TemplateRenderer } from '@/components/invoices/templates/template-types';

const templateRenderers: Record<InvoiceTemplateId, TemplateRenderer> = {
  minimalist: minimalistTemplate,
  corporate: corporateTemplate,
  creative: creativeTemplate,
  vintage: vintageTemplate,
  modern: modernTemplate
};

export default function InvoiceDocument({
  locale,
  currency,
  companyInfo,
  invoice,
  className
}: InvoiceDocumentProps) {
  const t = useTranslations('invoices');
  const intlLocale = getIntlLocale(locale);
  const companyLocation = [companyInfo.city, companyInfo.country, companyInfo.postalCode].filter(Boolean).join(', ');
  const companyInitial = (companyInfo.companyName ?? 'I').slice(0, 1).toUpperCase();
  const renderer = templateRenderers[invoice.templateId] ?? templateRenderers.minimalist;

  const context: InvoiceRenderContext = {
    currency,
    intlLocale,
    companyInfo,
    invoice,
    t,
    companyLocation,
    companyInitial
  };

  return (
    <article
      className={cn(
        'invoice-document mx-auto max-w-5xl overflow-hidden rounded-[32px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] md:p-8 print:max-w-none print:overflow-visible print:shadow-none',
        renderer.articleClassName,
        className
      )}
      style={renderer.articleStyle}
    >
      {renderer.render(context)}
    </article>
  );
}
