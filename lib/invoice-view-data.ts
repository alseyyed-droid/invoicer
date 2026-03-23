import { prisma } from '@/lib/prisma';
import type { InvoiceCompanyInfo, InvoiceSummaryRecord } from '@/lib/invoices';
import { serializeInvoiceRecord } from '@/lib/invoices';

export type InvoiceViewData = {
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoiceSummaryRecord;
};

function toCompanyInfo(input: {
  companyName?: string | null;
  companyEmail?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  companyLogo?: string | null;
  taxPerItem?: boolean | null;
}): InvoiceCompanyInfo {
  return {
    companyName: input.companyName,
    companyEmail: input.companyEmail,
    address: input.address,
    city: input.city,
    country: input.country,
    postalCode: input.postalCode,
    companyLogo: input.companyLogo,
    taxPerItem: input.taxPerItem ?? true
  };
}

export async function getPrivateInvoiceViewData(userId: string, invoiceId: string) {
  const [user, invoice] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
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
        }
      }
    }),
    prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId
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
    })
  ]);

  if (!user || !invoice) {
    return null;
  }

  return {
    currency: user.preferences?.currency ?? 'USD',
    companyInfo: toCompanyInfo(user.companyInfo ?? {}),
    invoice: serializeInvoiceRecord({
      ...invoice,
      shareToken: invoice.shareToken
    })
  } satisfies InvoiceViewData;
}

export async function getSharedInvoiceViewData(shareToken: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        {
          shareToken
        },
        {
          id: shareToken
        }
      ]
    },
    include: {
      lineItems: {
        orderBy: {
          createdAt: 'asc'
        },
        include: {
          taxes: true
        }
      },
      user: {
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
          }
        }
      }
    }
  });

  if (!invoice) {
    return null;
  }

  return {
    currency: invoice.user.preferences?.currency ?? 'USD',
    companyInfo: toCompanyInfo(invoice.user.companyInfo ?? {}),
    invoice: serializeInvoiceRecord(invoice)
  } satisfies InvoiceViewData;
}
