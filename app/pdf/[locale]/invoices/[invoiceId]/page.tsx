import { notFound } from 'next/navigation';
import { requireAuth } from '@/auth';
import InvoicePdfPage from '@/components/invoices/InvoicePdfPage';
import { getPrivateInvoiceViewData } from '@/lib/invoice-view-data';

export const dynamic = 'force-dynamic';

export default async function PrivateInvoicePdfRoute({
  params
}: {
  params:
    | { locale: string; invoiceId: string }
    | Promise<{ locale: string; invoiceId: string }>;
}) {
  const { locale, invoiceId } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const invoiceViewData = await getPrivateInvoiceViewData(session.user.id, invoiceId);

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
