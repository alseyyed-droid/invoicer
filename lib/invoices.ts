import {
  InvoiceDiscountType as PrismaInvoiceDiscountType,
  InvoiceStatus
} from '@/generated/prisma/client';

export const invoiceTaxHandlingValues = ['tax_free', 'zero_tax', 'taxable'] as const;
export type InvoiceTaxHandling = (typeof invoiceTaxHandlingValues)[number];

export const invoiceTemplateIds = [
  'minimalist',
  'corporate',
  'creative',
  'vintage',
  'modern'
] as const;
export type InvoiceTemplateId = (typeof invoiceTemplateIds)[number];

export const invoiceDiscountTypes = ['percentage', 'fixed'] as const;
export type InvoiceDiscountType = (typeof invoiceDiscountTypes)[number];

export type InvoiceTemplateOption = {
  id: InvoiceTemplateId;
  titleKey: string;
  descriptionKey: string;
};

export const invoiceTemplates: InvoiceTemplateOption[] = [
  {
    id: 'minimalist',
    titleKey: 'templates.minimalist.title',
    descriptionKey: 'templates.minimalist.description'
  },
  {
    id: 'corporate',
    titleKey: 'templates.corporate.title',
    descriptionKey: 'templates.corporate.description'
  },
  {
    id: 'creative',
    titleKey: 'templates.creative.title',
    descriptionKey: 'templates.creative.description'
  }
];

export type InvoiceTaxOption = {
  id: string;
  title: string;
  percentage: number;
};

export type SavedInvoiceItem = {
  id: string;
  name: string;
  price: number;
  unitType: string;
  taxTypeId: string | null;
  taxType: InvoiceTaxOption | null;
};

export type InvoiceEditorItem = {
  id?: string;
  savedItemId?: string;
  itemName: string;
  price: number;
  quantity: number;
  unitType?: string;
  taxTypeIds?: string[];
  taxes?: InvoiceTaxOption[];
  taxRate: number;
};

export type InvoiceTotals = {
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
};

export type InvoicePreviewData = {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail?: string | null;
  taxType: InvoiceTaxHandling;
  templateId: InvoiceTemplateId;
  discountType: InvoiceDiscountType;
  discountValue: number;
  discountAmount: number;
  notes?: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  items: Array<
    InvoiceEditorItem & {
      taxAmount: number;
      lineSubtotal: number;
      lineGrandTotal: number;
      taxLabel?: string | null;
    }
  >;
};

export type InvoiceCompanyInfo = {
  companyName?: string | null;
  companyEmail?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  companyLogo?: string | null;
  taxPerItem: boolean;
};

export type InvoiceSummaryRecord = Omit<InvoicePreviewData, 'id'> & {
  id: string;
  status: InvoiceStatus;
  shareToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceRecordLineTax = {
  id: string;
  taxTypeId: string | null;
  title: string;
  percentage: number;
};

export type InvoiceRecordLineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
  lineTotal: number;
  taxes: InvoiceRecordLineTax[];
};

export type InvoiceRecord = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: Date;
  notes: string | null;
  templateId: string;
  discountType: PrismaInvoiceDiscountType;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: InvoiceStatus;
  shareToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lineItems: InvoiceRecordLineItem[];
};

export function getIntlLocale(locale: string) {
  return locale === 'ar' ? 'ar-JO-u-nu-latn' : 'en-US-u-nu-latn';
}

export function getInvoiceTemplateId(templateId?: string | null): InvoiceTemplateId {
  return invoiceTemplateIds.includes(templateId as InvoiceTemplateId)
    ? (templateId as InvoiceTemplateId)
    : 'minimalist';
}

export function getInvoiceTaxHandlingFromTotal(taxTotal: number): InvoiceTaxHandling {
  return sanitizeNumber(taxTotal) > 0 ? 'taxable' : 'tax_free';
}

export function getInvoiceSharePath(locale: string, shareToken: string) {
  return `/${locale}/shared/invoices/${shareToken}`;
}

export function getInvoicePdfDownloadPath(locale: string, invoiceId: string) {
  const params = new URLSearchParams({ locale });
  return `/api/invoices/${invoiceId}/pdf?${params.toString()}`;
}

export function getSharedInvoicePdfDownloadPath(locale: string, shareToken: string) {
  const params = new URLSearchParams({ locale });
  return `/api/shared/invoices/${shareToken}/pdf?${params.toString()}`;
}

export function getInvoicePrintablePath(locale: string, invoiceId: string) {
  return `/pdf/${locale}/invoices/${invoiceId}`;
}

export function getSharedInvoicePrintablePath(locale: string, shareToken: string) {
  return `/pdf/${locale}/shared/invoices/${shareToken}`;
}

export function getInvoicePdfFilename(invoiceNumber: string) {
  return `${invoiceNumber || 'invoice'}.pdf`;
}

export function serializeInvoiceRecord(invoice: InvoiceRecord): InvoiceSummaryRecord {
  return {
    id: invoice.id,
    invoiceNumber: invoice.number,
    invoiceDate: invoice.invoiceDate.toISOString(),
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    taxType: getInvoiceTaxHandlingFromTotal(invoice.taxTotal),
    templateId: getInvoiceTemplateId(invoice.templateId),
    discountType: invoice.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
    discountValue: invoice.discountValue,
    discountAmount: invoice.discountAmount,
    notes: invoice.notes ?? '',
    subtotal: invoice.subtotal,
    taxTotal: invoice.taxTotal,
    grandTotal: invoice.grandTotal,
    status: invoice.status,
    shareToken: invoice.shareToken ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    items: invoice.lineItems.map((item) => {
      const taxAmount = item.lineTotal * (item.taxRate / 100);

      return {
        id: item.id,
        itemName: item.name,
        price: item.price,
        quantity: item.quantity,
        unitType: '',
        taxTypeIds: item.taxes.map((tax) => tax.taxTypeId).filter(Boolean) as string[],
        taxes: item.taxes.map((tax) => ({
          id: tax.taxTypeId ?? tax.id,
          title: tax.title,
          percentage: tax.percentage
        })),
        taxRate: item.taxRate,
        taxAmount,
        lineSubtotal: item.lineTotal,
        lineGrandTotal: item.lineTotal + taxAmount,
        taxLabel: item.taxes.map((tax) => `${tax.title} (${tax.percentage}%)`).join(', ') || null
      };
    })
  };
}

export function getLineSubtotal(item: Pick<InvoiceEditorItem, 'price' | 'quantity'>) {
  return sanitizeNumber(item.price) * sanitizeNumber(item.quantity);
}

export function getResolvedTaxRate(input: {
  invoiceTaxType: InvoiceTaxHandling;
  taxPerItem: boolean;
  invoiceTaxRate: number;
  itemTaxRate: number;
}) {
  if (input.invoiceTaxType !== 'taxable') {
    return 0;
  }

  return sanitizeNumber(input.taxPerItem ? input.itemTaxRate : input.invoiceTaxRate);
}

export function getLineTaxAmount(input: {
  item: Pick<InvoiceEditorItem, 'price' | 'quantity' | 'taxRate'>;
  invoiceTaxType: InvoiceTaxHandling;
  taxPerItem: boolean;
  invoiceTaxRate: number;
}) {
  const lineSubtotal = getLineSubtotal(input.item);
  const resolvedTaxRate = getResolvedTaxRate({
    invoiceTaxType: input.invoiceTaxType,
    taxPerItem: input.taxPerItem,
    invoiceTaxRate: input.invoiceTaxRate,
    itemTaxRate: input.item.taxRate
  });

  return lineSubtotal * (resolvedTaxRate / 100);
}

export function calculateInvoiceTotals(input: {
  items: InvoiceEditorItem[];
  invoiceTaxType: InvoiceTaxHandling;
  taxPerItem: boolean;
  invoiceTaxRate: number;
  discountType: InvoiceDiscountType;
  discountValue: number;
}) {
  const baseTotals = input.items.reduce<InvoiceTotals>(
    (totals, item) => {
      const lineSubtotal = getLineSubtotal(item);
      const lineTax = getLineTaxAmount({
        item,
        invoiceTaxType: input.invoiceTaxType,
        taxPerItem: input.taxPerItem,
        invoiceTaxRate: input.invoiceTaxRate
      });

      return {
        subtotal: totals.subtotal + lineSubtotal,
        taxTotal: totals.taxTotal + lineTax,
        discountAmount: 0,
        grandTotal: totals.grandTotal + lineSubtotal + lineTax
      };
    },
    {
      subtotal: 0,
      taxTotal: 0,
      discountAmount: 0,
      grandTotal: 0
    }
  );

  const discountAmount = calculateDiscountAmount(
    baseTotals.subtotal,
    input.discountType,
    input.discountValue
  );

  return {
    ...baseTotals,
    discountAmount,
    grandTotal: Math.max(0, baseTotals.subtotal + baseTotals.taxTotal - discountAmount)
  };
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: InvoiceDiscountType,
  discountValue: number
) {
  const normalizedSubtotal = Math.max(0, sanitizeNumber(subtotal));
  const normalizedDiscountValue = Math.max(0, sanitizeNumber(discountValue));

  if (discountType === 'percentage') {
    return Math.min(normalizedSubtotal, normalizedSubtotal * (normalizedDiscountValue / 100));
  }

  return Math.min(normalizedSubtotal, normalizedDiscountValue);
}

export function sanitizeNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function getInvoiceStatusKey(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'statuses.paid';
    case InvoiceStatus.OVERDUE:
      return 'statuses.overdue';
    case InvoiceStatus.SENT:
      return 'statuses.sent';
    default:
      return 'statuses.draft';
  }
}

export function getInvoiceStatusClassName(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'status-paid';
    case InvoiceStatus.OVERDUE:
      return 'status-overdue';
    case InvoiceStatus.SENT:
      return 'accent-active';
    default:
      return 'status-pending';
  }
}
