'use client';

import InvoiceEditor from '@/components/invoices/InvoiceEditor';
import type { InvoicePreviewData } from '@/lib/invoices';

type CreateInvoicePageProps = {
  locale: string;
  currency: string;
  initialInvoiceNumber: string;
  invoice?: InvoicePreviewData;
};

export default function CreateInvoicePage(props: CreateInvoicePageProps) {
  return <InvoiceEditor mode="create" {...props} />;
}
