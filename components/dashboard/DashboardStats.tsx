import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/generated/prisma/client';
import { formatCurrency } from '@/lib/utils';

function statusLabel(status: 'paid' | 'pending' | 'overdue') {
  if (status === 'paid') return 'Paid';
  if (status === 'pending') return 'Pending';
  return 'Overdue';
}

export default async function DashboardStats({ userId }: { userId: string }) {
  const latestInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: {
        in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT]
      }
    }
  });

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: InvoiceStatus.OVERDUE
    }
  });

  const stats = [
    {
      title: 'RECENT INVOICES',
      icon: 'history',
      valuePrimary: latestInvoice?.number ?? 'No invoices',
      valueSecondary: formatCurrency(latestInvoice?.grandTotal ?? 0),
      meta: latestInvoice?.customerName ?? 'Create your first invoice',
      label: statusLabel('paid'),
      labelClass: 'status-paid'
    },
    {
      title: 'PENDING INVOICES',
      icon: 'pending_actions',
      valuePrimary: `${pendingInvoices.length} invoices`,
      valueSecondary: formatCurrency(
        pendingInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0)
      ),
      meta: 'Awaiting payment',
      label: statusLabel('pending'),
      labelClass: 'status-pending'
    },
    {
      title: 'OVERDUE INVOICES',
      icon: 'error',
      valuePrimary: `${overdueInvoices.length} invoices`,
      valueSecondary: formatCurrency(
        overdueInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0)
      ),
      meta: 'Past due date',
      label: statusLabel('overdue'),
      labelClass: 'status-overdue'
    }
  ];

  return (
    <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {stats.map((card) => (
        <div key={card.title} className="stat-card">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-muted text-[12px] font-bold uppercase tracking-[0.08em]">{card.title}</h3>
            <span className="material-symbols-outlined text-soft">{card.icon}</span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[24px] font-bold leading-none text-[color:var(--text)]">{card.valuePrimary}</p>
              <p className="text-muted mt-1 text-sm">{card.meta}</p>
            </div>
            <div className="text-right">
              <p className="text-[30px] font-bold leading-none text-[color:var(--text)]">{card.valueSecondary}</p>
              <span className={`status-chip mt-2 ${card.labelClass}`}>{card.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
