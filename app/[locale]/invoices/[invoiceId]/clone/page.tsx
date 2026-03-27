import { notFound } from 'next/navigation';
import CreateInvoicePage from '@/components/invoices/CreateInvoicePage';
import { requireAuth } from '@/auth';
import { serializeInvoiceRecord, type InvoicePreviewData } from '@/lib/invoices';
import { prisma } from '@/lib/prisma';
import { getNextInvoiceNumber } from '@/lib/user-data';

function buildClonedInvoice(
  sourceInvoice: ReturnType<typeof serializeInvoiceRecord>,
  invoiceNumber: string
): InvoicePreviewData {
  return {
    invoiceNumber,
    invoiceDate: sourceInvoice.invoiceDate,
    customerName: sourceInvoice.customerName,
    customerEmail: sourceInvoice.customerEmail,
    taxType: 'tax_free',
    templateId: sourceInvoice.templateId,
    discountType: sourceInvoice.discountType,
    discountValue: sourceInvoice.discountValue,
    discountAmount: sourceInvoice.discountAmount,
    notes: sourceInvoice.notes,
    subtotal: sourceInvoice.subtotal,
    taxTotal: 0,
    grandTotal: Math.max(0, sourceInvoice.subtotal - sourceInvoice.discountAmount),
    items: sourceInvoice.items.map((item) => ({
      ...item,
      id: '',
      savedItemId: '',
      taxTypeIds: [],
      taxes: [],
      taxRate: 0,
      taxAmount: 0,
      taxLabel: null,
      lineGrandTotal: item.lineSubtotal
    }))
  };
}

export default async function CloneInvoiceRoute({
  params
}: {
  params:
    | { locale: string; invoiceId: string }
    | Promise<{ locale: string; invoiceId: string }>;
}) {
  const { locale, invoiceId } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const [user, initialInvoiceNumber] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferences: {
          select: {
            currency: true
          }
        },
        invoices: {
          where: {
            id: invoiceId,
            userId: session.user.id
          },
          take: 1,
          include: {
            lineItems: {
              orderBy: {
                createdAt: 'asc'
              },
              include: {
                taxes: true
              }
            }
          }
        }
      }
    }),
    getNextInvoiceNumber(session.user.id, locale)
  ]);

  const invoice = user?.invoices[0];

  if (!user || !invoice) {
    notFound();
  }

  const sourceInvoice = serializeInvoiceRecord(invoice);

  return (
    <CreateInvoicePage
      locale={locale}
      currency={user.preferences?.currency ?? 'USD'}
      initialInvoiceNumber={initialInvoiceNumber}
      invoice={buildClonedInvoice(sourceInvoice, initialInvoiceNumber)}
    />
  );
}
