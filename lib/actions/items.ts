'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/auth';
import type { ItemUnitType } from '@/lib/items';
import { prisma } from '@/lib/prisma';
import { itemUnitTypes } from '@/lib/items';

const itemSchema = z.object({
  locale: z.string().min(2),
  name: z.string().trim().min(1, 'Item name is required.').max(191, 'Item name is too long.'),
  price: z
    .number({
      error: 'Price is required.'
    })
    .refine((value) => Number.isFinite(value), 'Price is required.')
    .min(0, 'Price must be zero or greater.'),
  unitType: z.enum(itemUnitTypes, {
    error: 'Unit type is required.'
  }),
  description: z.string().trim().max(5000, 'Description is too long.').optional(),
  taxTypeId: z.string().trim().optional()
});

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateItemPaths(locale: string) {
  revalidatePath(`/${locale}/items`);
  revalidatePath(`/${locale}/invoices/new`);
}

async function validateTaxTypeOwnership(userId: string, taxTypeId?: string) {
  const normalizedTaxTypeId = normalizeOptional(taxTypeId);

  if (!normalizedTaxTypeId) {
    return { success: true as const, taxTypeId: null };
  }

  const taxType = await prisma.taxType.findFirst({
    where: {
      id: normalizedTaxTypeId,
      userId
    },
    select: { id: true }
  });

  if (!taxType) {
    return {
      success: false as const,
      error: 'Tax type not found.'
    };
  }

  return {
    success: true as const,
    taxTypeId: taxType.id
  };
}

function mapItem(item: {
  id: string;
  name: string;
  price: number;
  unitType: string;
  description: string | null;
  taxTypeId: string | null;
  taxType: {
    id: string;
    title: string;
    percentage: number;
  } | null;
}) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    unitType: item.unitType as ItemUnitType,
    description: item.description ?? '',
    taxTypeId: item.taxTypeId,
    taxType: item.taxType
  };
}

export async function createItemAction(input: z.infer<typeof itemSchema>) {
  const parsed = itemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid item details.'
    };
  }

  const { locale, name, price, unitType, description, taxTypeId } = parsed.data;
  const session = await requireAuth(locale);
  const taxTypeCheck = await validateTaxTypeOwnership(session.user.id, taxTypeId);

  if (!taxTypeCheck.success) {
    return taxTypeCheck;
  }

  const item = await prisma.item.create({
    data: {
      name,
      price,
      unitType,
      description: normalizeOptional(description),
      taxTypeId: taxTypeCheck.taxTypeId,
      userId: session.user.id
    },
    include: {
      taxType: {
        select: {
          id: true,
          title: true,
          percentage: true
        }
      }
    }
  });

  revalidateItemPaths(locale);

  return {
    success: true as const,
    message: 'Item created successfully.',
    item: mapItem(item)
  };
}

export async function updateItemAction(
  input: z.infer<typeof itemSchema> & {
    id: string;
  }
) {
  const parsed = itemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid item details.'
    };
  }

  const { locale, name, price, unitType, description, taxTypeId } = parsed.data;
  const session = await requireAuth(locale);

  const existingItem = await prisma.item.findFirst({
    where: {
      id: input.id,
      userId: session.user.id
    },
    select: { id: true }
  });

  if (!existingItem) {
    return {
      success: false as const,
      error: 'Item not found.'
    };
  }

  const taxTypeCheck = await validateTaxTypeOwnership(session.user.id, taxTypeId);

  if (!taxTypeCheck.success) {
    return taxTypeCheck;
  }

  const item = await prisma.item.update({
    where: { id: input.id },
    data: {
      name,
      price,
      unitType,
      description: normalizeOptional(description),
      taxTypeId: taxTypeCheck.taxTypeId
    },
    include: {
      taxType: {
        select: {
          id: true,
          title: true,
          percentage: true
        }
      }
    }
  });

  revalidateItemPaths(locale);

  return {
    success: true as const,
    message: 'Item updated successfully.',
    item: mapItem(item)
  };
}

export async function deleteItemAction(input: { id: string; locale: string }) {
  const session = await requireAuth(input.locale);

  const existingItem = await prisma.item.findFirst({
    where: {
      id: input.id,
      userId: session.user.id
    },
    select: { id: true }
  });

  if (!existingItem) {
    return {
      success: false as const,
      error: 'Item not found.'
    };
  }

  await prisma.item.delete({
    where: { id: input.id }
  });

  revalidateItemPaths(input.locale);

  return {
    success: true as const,
    message: 'Item deleted successfully.'
  };
}
