'use client';

import InvoiceEditor from '@/components/invoices/InvoiceEditor';
import type {
  InvoiceCompanyInfo,
  InvoicePreviewData,
  InvoiceTaxOption,
  SavedInvoiceItem
} from '@/lib/invoices';

type EditInvoicePageProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  savedItems: SavedInvoiceItem[];
  taxTypes: InvoiceTaxOption[];
  initialInvoiceNumber: string;
  invoice: InvoicePreviewData & { id: string };
};

export default function EditInvoicePage(props: EditInvoicePageProps) {
  return <InvoiceEditor mode="edit" {...props} />;
}
