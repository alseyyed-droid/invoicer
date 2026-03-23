import { notFound } from 'next/navigation';
import InvoiceViewPage from '@/components/invoices/InvoiceViewPage';
import { requireAuth } from '@/auth';
import {
  getInvoicePdfDownloadPath,
  getInvoiceSharePath
} from '@/lib/invoices';
import { getPrivateInvoiceViewData } from '@/lib/invoice-view-data';

export default async function InvoiceViewRoute({
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

  const shareAccessKey = invoiceViewData.invoice.shareToken ?? invoiceViewData.invoice.id;

  return (
    <InvoiceViewPage
      locale={locale}
      currency={invoiceViewData.currency}
      companyInfo={invoiceViewData.companyInfo}
      invoice={invoiceViewData.invoice}
      publicSharePath={getInvoiceSharePath(locale, shareAccessKey)}
      pdfDownloadPath={getInvoicePdfDownloadPath(locale, invoiceId)}
    />
  );
}
