import InvoicesPage from '@/components/invoices/InvoicesPage';
import { requireAuth } from '@/auth';
import { serializeInvoiceRecord } from '@/lib/invoices';
import { prisma } from '@/lib/prisma';

export default async function InvoicesRoute({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
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
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
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

  if (!user) {
    return null;
  }

  return (
    <InvoicesPage
      locale={locale}
      currency={user.preferences?.currency ?? 'USD'}
      initialInvoices={user.invoices.map((invoice) => serializeInvoiceRecord(invoice))}
    />
  );
}
