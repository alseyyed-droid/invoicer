import InvoiceDocument from '@/components/invoices/InvoiceDocument';
import type { InvoiceCompanyInfo, InvoiceSummaryRecord } from '@/lib/invoices';

type InvoicePdfPageProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoiceSummaryRecord;
};

export default function InvoicePdfPage({
  locale,
  currency,
  companyInfo,
  invoice
}: InvoicePdfPageProps) {
  return (
    <div className="min-h-screen bg-white px-7 py-6">
      <div className="mx-auto w-full max-w-[980px]" data-pdf-root>
        <InvoiceDocument
          locale={locale}
          currency={currency}
          companyInfo={companyInfo}
          invoice={invoice}
        />
      </div>
    </div>
  );
}
