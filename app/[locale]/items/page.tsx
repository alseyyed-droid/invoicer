import ItemsPage from '@/components/items/ItemsPage';
import { requireAuth } from '@/auth';
import type { ItemUnitType } from '@/lib/items';
import { prisma } from '@/lib/prisma';

export default async function ItemsRoute({
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
      taxTypes: {
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          percentage: true
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
          description: true,
          taxTypeId: true,
          taxType: {
            select: {
              id: true,
              title: true,
              percentage: true
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
    <ItemsPage
      locale={locale}
      currency={user.preferences?.currency ?? 'USD'}
      taxTypes={user.taxTypes}
      initialItems={user.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        unitType: item.unitType as ItemUnitType,
        description: item.description ?? '',
        taxTypeId: item.taxTypeId,
        taxType: item.taxType
      }))}
    />
  );
}
