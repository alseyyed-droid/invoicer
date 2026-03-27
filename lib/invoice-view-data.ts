import { prisma } from '@/lib/prisma';
import type { InvoiceCompanyInfo, InvoiceSummaryRecord } from '@/lib/invoices';
import { emptyInvoiceCompanyInfo, serializeInvoiceRecord } from '@/lib/invoices';

export type InvoiceViewData = {
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoiceSummaryRecord;
};

export async function getPrivateInvoiceViewData(userId: string, invoiceId: string) {
  const [user, invoice] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: {
          select: {
            currency: true
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
    companyInfo: emptyInvoiceCompanyInfo,
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
    companyInfo: emptyInvoiceCompanyInfo,
    invoice: serializeInvoiceRecord(invoice)
  } satisfies InvoiceViewData;
}
