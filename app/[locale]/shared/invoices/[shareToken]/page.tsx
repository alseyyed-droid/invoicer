import { notFound } from 'next/navigation';
import InvoiceViewPage from '@/components/invoices/InvoiceViewPage';
import {
  getInvoiceSharePath,
  getSharedInvoicePdfDownloadPath
} from '@/lib/invoices';
import { getSharedInvoiceViewData } from '@/lib/invoice-view-data';

export default async function SharedInvoiceViewRoute({
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
    <InvoiceViewPage
      locale={locale}
      currency={invoiceViewData.currency}
      companyInfo={invoiceViewData.companyInfo}
      invoice={invoiceViewData.invoice}
      publicSharePath={getInvoiceSharePath(locale, shareToken)}
      pdfDownloadPath={getSharedInvoicePdfDownloadPath(locale, shareToken)}
      isPublicView
    />
  );
}
