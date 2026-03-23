import DashboardInvoiceActions from '@/components/invoices/DashboardInvoiceActions';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/generated/prisma/client';
import {
  getInvoiceTaxHandlingFromTotal,
  getInvoiceTemplateId,
  type InvoiceSummaryRecord
} from '@/lib/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getStatusMeta(status: InvoiceStatus) {
  if (status === InvoiceStatus.PAID) {
    return { label: 'Paid', className: 'status-paid' };
  }

  if (status === InvoiceStatus.OVERDUE) {
    return { label: 'Overdue', className: 'status-overdue' };
  }

  return { label: 'Pending', className: 'status-pending' };
}

export default async function InvoiceTable({
  title = 'Invoice History',
  userId,
  locale
}: {
  title?: string;
  userId: string;
  locale: string;
}) {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <div className="table-shell">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
        <h2 className="text-[17px] font-bold text-[color:var(--text)]">{title}</h2>
        <div className="flex gap-2">
          <button className="text-muted rounded-lg p-2 hover:bg-[var(--bg)]">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="text-muted rounded-lg p-2 hover:bg-[var(--bg)]">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-lg font-semibold text-[color:var(--text)]">No invoices yet</p>
          <p className="text-muted mt-2 text-sm">
            Create your first invoice and it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    Invoice
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    Customer
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    Date
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    Amount
                  </th>
                  <th className="text-muted px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]">
                    Status
                  </th>
                  <th className="text-muted px-5 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => {
                  const status = getStatusMeta(invoice.status);
                  const invoiceSummary: InvoiceSummaryRecord = {
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
                    items: []
                  };

                  return (
                    <tr key={invoice.id} className="transition-colors hover:bg-[var(--bg)]">
                      <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                        #{invoice.number}
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="tone-emerald flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold">
                            {getInitials(invoice.customerName)}
                          </div>
                          <span className="text-[15px] font-semibold text-[color:var(--text)]">
                            {invoice.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted px-5 py-5 text-[15px]">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-5 py-5 text-[15px] font-semibold text-[color:var(--text)]">
                        {formatCurrency(invoice.grandTotal)}
                      </td>
                      <td className="px-5 py-5">
                        <span className={`status-chip ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <DashboardInvoiceActions
                          locale={locale}
                          invoice={invoiceSummary}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg)] px-5 py-4">
            <p className="text-muted text-[15px]">
              Showing {Math.min(invoices.length, 10)} of {invoices.length} invoices
            </p>
            <div className="flex gap-2">
              <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[var(--bg)]">
                Previous
              </button>
              <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[var(--bg)]">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
