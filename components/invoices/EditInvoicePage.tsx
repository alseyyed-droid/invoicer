'use client';

import InvoiceEditor from '@/components/invoices/InvoiceEditor';
import type { InvoicePreviewData } from '@/lib/invoices';

type EditInvoicePageProps = {
  locale: string;
  currency: string;
  initialInvoiceNumber: string;
  invoice: InvoicePreviewData & { id: string };
};

export default function EditInvoicePage(props: EditInvoicePageProps) {
  return <InvoiceEditor mode="edit" {...props} />;
}
