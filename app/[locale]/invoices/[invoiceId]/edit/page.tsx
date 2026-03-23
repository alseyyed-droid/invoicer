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
      companyInfo: {
        select: {
          companyName: true,
          companyEmail: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          companyLogo: true,
          taxPerItem: true
        }
      },
      items: {
        where: {
          userId: session.user.id
        },
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          price: true,
          unitType: true,
          taxTypeId: true,
          taxType: {
            select: {
              id: true,
              title: true,
              percentage: true
            }
          }
        }
      },
      taxTypes: {
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          percentage: true
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
      companyInfo={{
        companyName: user.companyInfo?.companyName,
        companyEmail: user.companyInfo?.companyEmail,
        address: user.companyInfo?.address,
        city: user.companyInfo?.city,
        country: user.companyInfo?.country,
        postalCode: user.companyInfo?.postalCode,
        companyLogo: user.companyInfo?.companyLogo,
        taxPerItem: user.companyInfo?.taxPerItem ?? true
      }}
      taxTypes={user.taxTypes}
      savedItems={user.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        unitType: item.unitType,
        taxTypeId: item.taxTypeId,
        taxType: item.taxType
      }))}
      initialInvoiceNumber={invoice.number}
      invoice={serializeInvoiceRecord(invoice)}
    />
  );
}
