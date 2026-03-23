import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { InvoiceCompanyInfo, InvoicePreviewData } from '@/lib/invoices';

export type InvoiceDocumentProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoicePreviewData;
  className?: string;
};

export type InvoiceTranslations = ReturnType<typeof useTranslations>;

export type InvoiceRenderContext = {
  currency: string;
  intlLocale: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoicePreviewData;
  t: InvoiceTranslations;
  companyLocation: string;
  companyInitial: string;
};

export type TemplateRenderer = {
  articleClassName?: string;
  articleStyle?: CSSProperties;
  render: (context: InvoiceRenderContext) => ReactNode;
};
