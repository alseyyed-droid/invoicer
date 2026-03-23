'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { InvoiceDiscountType, InvoiceStatus, Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import { requireAuth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateInvoiceTotals,
  invoiceDiscountTypes,
  invoiceTaxHandlingValues,
  invoiceTemplateIds
} from '@/lib/invoices';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  savedItemId: z.string().optional(),
  itemName: z.string().trim().min(1, 'Item name is required.').max(191, 'Item name is too long.'),
  price: z.number().finite('Price is required.').min(0, 'Price must be zero or greater.'),
  quantity: z.number().int('Quantity must be a whole number.').min(1, 'Quantity must be at least 1.'),
  unitType: z.string().trim().max(50, 'Unit type is too long.').optional(),
  taxTypeIds: z.array(z.string().trim()).default([])
});

const invoiceSchema = z.object({
  locale: z.string().min(2),
  customerName: z.string().trim().min(1, 'Customer name is required.'),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email address.'),
  invoiceDate: z.string().min(1, 'Invoice date is required.'),
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required.'),
  taxType: z.enum(invoiceTaxHandlingValues),
  invoiceTaxTypeIds: z.array(z.string().trim()).default([]),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required.'),
  notes: z.string().optional(),
  templateId: z.enum(invoiceTemplateIds),
  discountType: z.enum(invoiceDiscountTypes),
  discountValue: z.number().finite().min(0, 'Discount value must be zero or greater.'),
  taxPerItem: z.boolean()
});

const updateInvoiceSchema = invoiceSchema.extend({
  id: z.string().min(1)
});

type CreateInvoiceInput = z.infer<typeof invoiceSchema>;
type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

type ResolvedTaxType = {
  id: string;
  title: string;
  percentage: number;
};

function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function createInvoiceShareToken() {
  return randomUUID();
}

function toPrismaDiscountType(discountType: CreateInvoiceInput['discountType']) {
  return discountType === 'percentage' ? InvoiceDiscountType.PERCENTAGE : InvoiceDiscountType.FIXED;
}

async function getAvailableTaxTypes(userId: string, input: Pick<CreateInvoiceInput, 'items' | 'invoiceTaxTypeIds'>) {
  const uniqueTaxTypeIds = Array.from(
    new Set(
      [
        ...input.items.flatMap((item) => item.taxTypeIds.map((taxTypeId) => normalizeOptional(taxTypeId))),
        ...input.invoiceTaxTypeIds.map((taxTypeId) => normalizeOptional(taxTypeId))
      ].filter((value): value is string => Boolean(value))
    )
  );

  if (!uniqueTaxTypeIds.length) {
    return new Map<string, ResolvedTaxType>();
  }

  const taxTypes = await prisma.taxType.findMany({
    where: {
      userId,
      id: {
        in: uniqueTaxTypeIds
      }
    },
    select: {
      id: true,
      title: true,
      percentage: true
    }
  });

  const taxTypeMap = new Map(taxTypes.map((taxType) => [taxType.id, taxType]));

  for (const taxTypeId of uniqueTaxTypeIds) {
    if (!taxTypeMap.has(taxTypeId)) {
      throw new Error('Tax type not found.');
    }
  }

  return taxTypeMap;
}

async function resolveLineItems(
  userId: string,
  input: Pick<
    CreateInvoiceInput,
    'items' | 'taxType' | 'taxPerItem' | 'invoiceTaxTypeIds' | 'discountType' | 'discountValue'
  >
) {
  const taxTypeMap = await getAvailableTaxTypes(userId, input);
  const invoiceLevelTaxes =
    input.taxType === 'taxable' && !input.taxPerItem
      ? input.invoiceTaxTypeIds
          .map((taxTypeId) => normalizeOptional(taxTypeId))
          .filter((value): value is string => Boolean(value))
          .map((taxTypeId) => {
            const taxType = taxTypeMap.get(taxTypeId);

            if (!taxType) {
              throw new Error('Tax type not found.');
            }

            return taxType;
          })
      : [];

  const normalizedItems = input.items.map((item) => {
    const appliedTaxes =
      input.taxType !== 'taxable'
        ? []
        : input.taxPerItem
          ? item.taxTypeIds
              .map((taxTypeId) => normalizeOptional(taxTypeId))
              .filter((value): value is string => Boolean(value))
              .map((taxTypeId) => {
                const taxType = taxTypeMap.get(taxTypeId);

                if (!taxType) {
                  throw new Error('Tax type not found.');
                }

                return taxType;
              })
          : invoiceLevelTaxes;
    const lineSubtotal = item.price * item.quantity;
    const taxRate = appliedTaxes.reduce((sum, tax) => sum + tax.percentage, 0);

    return {
      id: item.id,
      name: item.itemName,
      quantity: item.quantity,
      price: item.price,
      unitType: normalizeOptional(item.unitType),
      taxRate,
      lineTotal: lineSubtotal,
      taxes: appliedTaxes.map((tax) => ({
        taxTypeId: tax.id,
        title: tax.title,
        percentage: tax.percentage,
        amount: lineSubtotal * (tax.percentage / 100)
      }))
    };
  });

  const totals = calculateInvoiceTotals({
    items: normalizedItems.map((item) => ({
      itemName: item.name,
      price: item.price,
      quantity: item.quantity,
      unitType: item.unitType ?? '',
      taxTypeIds: item.taxes.map((tax) => tax.taxTypeId ?? '').filter(Boolean),
      taxes: item.taxes.map((tax) => ({
        id: tax.taxTypeId ?? '',
        title: tax.title,
        percentage: tax.percentage
      })),
      taxRate: item.taxRate
    })),
    invoiceTaxType: input.taxType,
    taxPerItem: true,
    invoiceTaxRate: 0,
    discountType: input.discountType,
    discountValue: input.discountValue
  });

  return {
    normalizedItems,
    totals
  };
}

function revalidateInvoicePaths(locale: string, invoiceId?: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/invoices`);
  revalidatePath(`/${locale}/invoices/new`);

  if (invoiceId) {
    revalidatePath(`/${locale}/invoices/${invoiceId}/edit`);
  }
}

function getDuplicateNumberError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return 'Invoice number already exists.';
  }

  return null;
}

function getActionError(error: unknown) {
  if (error instanceof Error && error.message === 'Tax type not found.') {
    return error.message;
  }

  return null;
}

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const parsed = invoiceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid invoice payload.'
    };
  }

  const data = parsed.data;
  const session = await requireAuth(data.locale);

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      userId: session.user.id,
      number: data.invoiceNumber
    },
    select: { id: true }
  });

  if (existingInvoice) {
    return {
      success: false as const,
      error: 'Invoice number already exists.'
    };
  }

  try {
    const lineItemsResult = await resolveLineItems(session.user.id, data);
    const invoice = await prisma.invoice.create({
      data: {
        number: data.invoiceNumber,
        shareToken: createInvoiceShareToken(),
        customerName: data.customerName,
        customerEmail: normalizeOptional(data.customerEmail) ?? '',
        invoiceDate: new Date(data.invoiceDate),
        notes: normalizeOptional(data.notes),
        templateId: data.templateId,
        discountType: toPrismaDiscountType(data.discountType),
        discountValue: data.discountValue,
        discountAmount: lineItemsResult.totals.discountAmount,
        subtotal: lineItemsResult.totals.subtotal,
        taxTotal: lineItemsResult.totals.taxTotal,
        grandTotal: lineItemsResult.totals.grandTotal,
        status: InvoiceStatus.DRAFT,
        locale: data.locale,
        userId: session.user.id,
        lineItems: {
          create: lineItemsResult.normalizedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
            taxes: {
              create: item.taxes.map((tax) => ({
                taxTypeId: tax.taxTypeId,
                title: tax.title,
                percentage: tax.percentage,
                amount: tax.amount
              }))
            }
          }))
        }
      }
    });

    revalidateInvoicePaths(data.locale, invoice.id);

    return {
      success: true as const,
      invoiceId: invoice.id
    };
  } catch (error) {
    const specificError = getActionError(error);
    const duplicateError = getDuplicateNumberError(error);

    return {
      success: false as const,
      error: specificError ?? duplicateError ?? 'Unable to create invoice right now.'
    };
  }
}

export async function updateInvoiceAction(input: UpdateInvoiceInput) {
  const parsed = updateInvoiceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid invoice payload.'
    };
  }

  const data = parsed.data;
  const session = await requireAuth(data.locale);

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: data.id,
      userId: session.user.id
    },
    select: {
      id: true
    }
  });

  if (!existingInvoice) {
    return {
      success: false as const,
      error: 'Invoice not found.'
    };
  }

  const duplicateInvoice = await prisma.invoice.findFirst({
    where: {
      userId: session.user.id,
      number: data.invoiceNumber,
      id: {
        not: data.id
      }
    },
    select: {
      id: true
    }
  });

  if (duplicateInvoice) {
    return {
      success: false as const,
      error: 'Invoice number already exists.'
    };
  }

  try {
    const lineItemsResult = await resolveLineItems(session.user.id, data);

    await prisma.invoice.update({
      where: {
        id: data.id
      },
      data: {
        number: data.invoiceNumber,
        customerName: data.customerName,
        customerEmail: normalizeOptional(data.customerEmail) ?? '',
        invoiceDate: new Date(data.invoiceDate),
        notes: normalizeOptional(data.notes),
        templateId: data.templateId,
        discountType: toPrismaDiscountType(data.discountType),
        discountValue: data.discountValue,
        discountAmount: lineItemsResult.totals.discountAmount,
        subtotal: lineItemsResult.totals.subtotal,
        taxTotal: lineItemsResult.totals.taxTotal,
        grandTotal: lineItemsResult.totals.grandTotal,
        lineItems: {
          deleteMany: {},
          create: lineItemsResult.normalizedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
            taxes: {
              create: item.taxes.map((tax) => ({
                taxTypeId: tax.taxTypeId,
                title: tax.title,
                percentage: tax.percentage,
                amount: tax.amount
              }))
            }
          }))
        }
      }
    });

    revalidateInvoicePaths(data.locale, data.id);

    return {
      success: true as const,
      invoiceId: data.id
    };
  } catch (error) {
    const specificError = getActionError(error);
    const duplicateError = getDuplicateNumberError(error);

    return {
      success: false as const,
      error: specificError ?? duplicateError ?? 'Unable to update invoice right now.'
    };
  }
}

export async function deleteInvoiceAction(input: { id: string; locale: string }) {
  const session = await requireAuth(input.locale);

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: input.id,
      userId: session.user.id
    },
    select: {
      id: true
    }
  });

  if (!existingInvoice) {
    return {
      success: false as const,
      error: 'Invoice not found.'
    };
  }

  await prisma.invoice.delete({
    where: {
      id: input.id
    }
  });

  revalidateInvoicePaths(input.locale, input.id);

  return {
    success: true as const,
    message: 'Invoice deleted successfully.'
  };
}
