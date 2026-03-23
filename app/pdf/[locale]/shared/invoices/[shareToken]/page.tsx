import { notFound } from 'next/navigation';
import InvoicePdfPage from '@/components/invoices/InvoicePdfPage';
import { getSharedInvoiceViewData } from '@/lib/invoice-view-data';

export const dynamic = 'force-dynamic';

export default async function SharedInvoicePdfRoute({
  params
}: {
  params:
    | { locale: string; shareToken: string }
    | Promise<{ locale: string; shareToken: string }>;
}) {
  const { locale, shareToken } = await Promise.resolve(params);
  const invoiceViewData = await getSharedInvoiceViewData(shareToken);

  if (!invoiceViewData) {
    notFound();
  }

  return (
    <InvoicePdfPage
      locale={locale}
      currency={invoiceViewData.currency}
      companyInfo={invoiceViewData.companyInfo}
      invoice={invoiceViewData.invoice}
    />
  );
}
