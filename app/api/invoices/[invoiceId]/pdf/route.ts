import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getInvoicePdfFilename,
  getInvoiceSharePath
} from '@/lib/invoices';
import { getPrivateInvoiceViewData } from '@/lib/invoice-view-data';
import { generatePdfFromUrl } from '@/lib/invoice-pdf-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ invoiceId: string }> | { invoiceId: string };
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await Promise.resolve(context.params);
    const locale = request.nextUrl.searchParams.get('locale') ?? 'en';
    const invoiceViewData = await getPrivateInvoiceViewData(session.user.id, invoiceId);

    if (!invoiceViewData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const printableToken = invoiceViewData.invoice.shareToken ?? invoiceId;
    const printableUrl = new URL(
      getInvoiceSharePath(locale, printableToken),
      request.nextUrl.origin
    ).toString();
    const pdf = await generatePdfFromUrl({
      selector: '.invoice-document',
      url: printableUrl
    });
    const filename = getInvoicePdfFilename(invoiceViewData.invoice.invoiceNumber);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('[InvoicePdf] private_pdf_failed', error);
    return NextResponse.json({ error: 'Unable to generate PDF.' }, { status: 500 });
  }
}
