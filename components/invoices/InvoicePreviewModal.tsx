'use client';

import { useTranslations } from 'next-intl';
import InvoiceFactsPreview from '@/components/invoices/InvoiceFactsPreview';
import type { InvoiceCompanyInfo, InvoicePreviewData } from '@/lib/invoices';

type InvoicePreviewModalProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoicePreviewData;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  isPending?: boolean;
};

export default function InvoicePreviewModal({
  locale,
  currency,
  companyInfo,
  invoice,
  onClose,
  onConfirm,
  confirmLabel,
  isPending = false
}: InvoicePreviewModalProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');

  return (
    <div className="invoice-preview-modal fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="invoice-preview-dialog mx-auto flex min-h-full max-w-6xl items-center justify-center">
        <div className="invoice-preview-shell shell-card w-full overflow-hidden rounded-[32px] shadow-2xl">
          <div className="invoice-preview-header print-hidden flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div>
              <h2 className="text-lg font-bold">{t('preview')}</h2>
              <p className="text-sm">{t('preview_description')}</p>
            </div>
            <button type="button" onClick={onClose} className="text-muted rounded-xl p-2 hover:bg-[var(--bg)]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="invoice-preview-body max-h-[75vh] overflow-y-auto p-4 md:p-6 print:max-h-none print:overflow-visible print:p-0">
            <InvoiceFactsPreview locale={locale} currency={currency} companyInfo={companyInfo} invoice={invoice} />
          </div>

          <div className="invoice-preview-actions print-hidden flex flex-col-reverse gap-3 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {commonT('cancel')}
            </button>
            {onConfirm && (
              <button type="button" onClick={onConfirm} disabled={isPending} className="btn btn-primary">
                {isPending ? t('saving') : confirmLabel ?? t('create_invoice')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
