'use client';

import InvoiceEditor from '@/components/invoices/InvoiceEditor';
import type {
  InvoiceCompanyInfo,
  InvoicePreviewData,
  InvoiceTaxOption,
  SavedInvoiceItem
} from '@/lib/invoices';

type CreateInvoicePageProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  savedItems: SavedInvoiceItem[];
  taxTypes: InvoiceTaxOption[];
  initialInvoiceNumber: string;
  invoice?: InvoicePreviewData;
};

export default function CreateInvoicePage(props: CreateInvoicePageProps) {
  return <InvoiceEditor mode="create" {...props} />;
}
