import CreateInvoicePage from '@/components/invoices/CreateInvoicePage';
import { requireAuth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureUserData, getNextInvoiceNumber } from '@/lib/user-data';

export default async function NewInvoiceRoute({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const [{ companyInfo, preferences }, initialInvoiceNumber, user] = await Promise.all([
    ensureUserData(session.user.id, locale),
    getNextInvoiceNumber(session.user.id, locale),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
        }
      }
    })
  ]);

  if (!user) {
    return null;
  }

  return (
    <CreateInvoicePage
      locale={locale}
      currency={preferences.currency}
      companyInfo={{
        companyName: companyInfo.companyName,
        companyEmail: companyInfo.companyEmail,
        address: companyInfo.address,
        city: companyInfo.city,
        country: companyInfo.country,
        postalCode: companyInfo.postalCode,
        companyLogo: companyInfo.companyLogo,
        taxPerItem: companyInfo.taxPerItem
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
      initialInvoiceNumber={initialInvoiceNumber}
    />
  );
}
