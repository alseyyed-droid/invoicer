'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import DeleteInvoiceConfirmation from '@/components/invoices/DeleteInvoiceConfirmation';
import InvoicesTable from '@/components/invoices/InvoicesTable';
import type { InvoiceSummaryRecord } from '@/lib/invoices';

type InvoicesPageProps = {
  locale: string;
  currency: string;
  initialInvoices: InvoiceSummaryRecord[];
};

export default function InvoicesPage({
  locale,
  currency,
  initialInvoices
}: InvoicesPageProps) {
  const t = useTranslations('invoices');
  const [invoices, setInvoices] = useState(initialInvoices);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceSummaryRecord | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle mt-2">{t('subtitle')}</p>
        </div>

        <Link href={`/${locale}/invoices/new`} className="btn btn-primary">
          <span className="material-symbols-outlined">add</span>
          {t('create_invoice')}
        </Link>
      </div>

      {message && <div className="alert-success">{message}</div>}

      {invoices.length === 0 ? (
        <section className="shell-card rounded-[28px] px-6 py-14 text-center shadow-[0_14px_30px_rgba(16,185,129,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined !text-[30px]">description</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold">{t('empty_title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm">{t('empty_description')}</p>
          <Link href={`/${locale}/invoices/new`} className="btn btn-primary mt-6">
            <span className="material-symbols-outlined">add</span>
            {t('create_invoice')}
          </Link>
        </section>
      ) : (
        <InvoicesTable
          locale={locale}
          currency={currency}
          invoices={invoices}
          onDelete={setDeletingInvoice}
        />
      )}

      {deletingInvoice && (
        <DeleteInvoiceConfirmation
          locale={locale}
          invoice={deletingInvoice}
          onClose={() => setDeletingInvoice(null)}
          onDeleted={(invoiceId, nextMessage) => {
            setInvoices((current) => current.filter((invoice) => invoice.id !== invoiceId));
            setMessage(nextMessage);
          }}
        />
      )}
    </div>
  );
}
