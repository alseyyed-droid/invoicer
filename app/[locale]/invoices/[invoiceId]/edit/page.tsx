import { notFound } from 'next/navigation';
import EditInvoicePage from '@/components/invoices/EditInvoicePage';
import { requireAuth } from '@/auth';
import { serializeInvoiceRecord } from '@/lib/invoices';
import { prisma } from '@/lib/prisma';

export default async function EditInvoiceRoute({
  params
}: {
  params:
    | { locale: string; invoiceId: string }
    | Promise<{ locale: string; invoiceId: string }>;
}) {
  const { locale, invoiceId } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const user = await prisma.user.findUnique({
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
  });

  const invoice = user?.invoices[0];

  if (!user || !invoice) {
    notFound();
  }

  return (
    <EditInvoicePage
      locale={locale}
      currency={user.preferences?.currency ?? 'USD'}
      initialInvoiceNumber={invoice.number}
      invoice={serializeInvoiceRecord(invoice)}
    />
  );
}
