'use client';

import { useTranslations } from 'next-intl';
import InvoiceDocument from '@/components/invoices/InvoiceDocument';
import { emptyInvoiceCompanyInfo, invoiceTemplates, type InvoiceTemplateId } from '@/lib/invoices';
import { cn } from '@/lib/utils';

type InvoiceTemplateSelectorModalProps = {
  locale: string;
  selectedTemplateId: InvoiceTemplateId;
  onSelect: (templateId: InvoiceTemplateId) => void;
  onClose: () => void;
};

const previewBaseInvoice = {
  invoiceNumber: 'INV-24018',
  invoiceDate: '2026-03-22',
  customerName: 'Atlas Retail',
  customerEmail: 'ops@atlas.example',
  taxType: 'tax_free' as const,
  discountType: 'fixed' as const,
  discountValue: 120,
  discountAmount: 120,
  notes: '<p>Thank you for your business. Payment due within 14 days.</p>',
  subtotal: 4180,
  taxTotal: 0,
  grandTotal: 4060,
  items: [
    {
      id: 'preview-1',
      itemName: 'Brand identity sprint',
      price: 1800,
      quantity: 1,
      unitType: 'project',
      taxTypeIds: [],
      taxes: [],
      taxRate: 0,
      taxAmount: 0,
      lineSubtotal: 1800,
      lineGrandTotal: 1800,
      taxLabel: null
    },
    {
      id: 'preview-2',
      itemName: 'Interface design system',
      price: 595,
      quantity: 4,
      unitType: 'screen',
      taxTypeIds: [],
      taxes: [],
      taxRate: 0,
      taxAmount: 0,
      lineSubtotal: 2380,
      lineGrandTotal: 2380,
      taxLabel: null
    }
  ]
};

export default function InvoiceTemplateSelectorModal({
  locale,
  selectedTemplateId,
  onSelect,
  onClose
}: InvoiceTemplateSelectorModalProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="shell-card w-full max-w-5xl rounded-[32px] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">{t('template_selector')}</h2>
            <p className="text-sm">{t('template_selector_description')}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted rounded-xl p-2 hover:bg-[var(--bg)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {invoiceTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onSelect(template.id);
                  onClose();
                }}
                className={cn(
                  'rounded-[24px] border p-4 text-left transition-all',
                  selectedTemplateId === template.id
                    ? 'accent-active-bordered shadow-[0_10px_30px_rgba(16,185,129,0.12)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-emerald-200 hover:bg-emerald-50/40 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t(template.titleKey)}</span>
                  {selectedTemplateId === template.id && (
                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                  )}
                </div>
                <p className="text-muted text-sm">{t(template.descriptionKey)}</p>
                <div className="surface-inset mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
                  <div className="pointer-events-none h-[250px] overflow-hidden">
                    <div className="origin-top-left scale-[0.28]">
                      <div className="w-[1180px] p-4">
                        <InvoiceDocument
                          locale={locale}
                          currency="USD"
                          companyInfo={emptyInvoiceCompanyInfo}
                          invoice={{ ...previewBaseInvoice, templateId: template.id }}
                          className="shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--border)] px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {commonT('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
