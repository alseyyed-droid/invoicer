import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoicePdfFilename,
  getInvoiceSharePath
} from '@/lib/invoices';
import { getSharedInvoiceViewData } from '@/lib/invoice-view-data';
import { generatePdfFromUrl } from '@/lib/invoice-pdf-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ shareToken: string }> | { shareToken: string };
  }
) {
  try {
    const { shareToken } = await Promise.resolve(context.params);
    const locale = request.nextUrl.searchParams.get('locale') ?? 'en';
    const invoiceViewData = await getSharedInvoiceViewData(shareToken);

    if (!invoiceViewData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const printableUrl = new URL(getInvoiceSharePath(locale, shareToken), request.nextUrl.origin).toString();
    const pdf = await generatePdfFromUrl({
      selector: '.invoice-document',
      url: printableUrl
    });
    const filename = getInvoicePdfFilename(invoiceViewData.invoice.invoiceNumber);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('[InvoicePdf] shared_pdf_failed', error);
    return NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 });
  }
}
