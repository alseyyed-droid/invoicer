'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { deleteInvoiceAction } from '@/lib/actions/invoices';
import type { InvoiceSummaryRecord } from '@/lib/invoices';

type DeleteInvoiceConfirmationProps = {
  locale: string;
  invoice: InvoiceSummaryRecord;
  onClose: () => void;
  onDeleted: (invoiceId: string, message: string) => void;
};

export default function DeleteInvoiceConfirmation({
  locale,
  invoice,
  onClose,
  onDeleted
}: DeleteInvoiceConfirmationProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteInvoiceAction({
        id: invoice.id ?? '',
        locale
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onDeleted(invoice.id ?? '', t('messages.deleted'));
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="shell-card w-full max-w-md rounded-[28px] p-6 shadow-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <span className="material-symbols-outlined">delete</span>
        </div>
        <h2 className="text-xl font-bold">{commonT('delete')}</h2>
        <p className="mt-2 text-sm">{t('confirm_delete_message')}</p>

        {error && <div className="alert-error mt-5">{error}</div>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {commonT('cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn bg-rose-600 text-white hover:bg-rose-700"
            disabled={isPending}
          >
            {isPending ? t('deleting') : commonT('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
