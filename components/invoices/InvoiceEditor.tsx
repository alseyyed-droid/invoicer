'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal';
import InvoiceTemplateSelectorModal from '@/components/invoices/InvoiceTemplateSelectorModal';
import { createInvoiceAction, updateInvoiceAction } from '@/lib/actions/invoices';
import {
  calculateInvoiceTotals,
  emptyInvoiceCompanyInfo,
  getIntlLocale,
  getLineSubtotal,
  invoiceDiscountTypes,
  invoiceTemplateIds,
  invoiceTemplates,
  type InvoicePreviewData,
  type InvoiceTemplateId
} from '@/lib/invoices';
import { formatCurrency } from '@/lib/utils';

const invoiceEditorSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required.'),
  customerEmail: z
    .string()
    .trim()
    .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email address.'),
  invoiceDate: z.string().min(1, 'Invoice date is required.'),
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required.'),
  discountType: z.enum(invoiceDiscountTypes),
  discountValue: z.number().finite().min(0),
  items: z
    .array(
      z.object({
        id: z.string(),
        itemName: z.string().trim().min(1, 'Item name is required.'),
        price: z.number().finite().min(0, 'Price must be zero or greater.'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
        unitType: z.string(),
        taxTypeIds: z.array(z.string()),
        taxRate: z.number().finite().min(0)
      })
    )
    .min(1, 'At least one invoice item is required.'),
  notes: z.string(),
  templateId: z.enum(invoiceTemplateIds)
});

type InvoiceEditorValues = z.infer<typeof invoiceEditorSchema>;

type InvoiceEditorProps = {
  mode: 'create' | 'edit';
  locale: string;
  currency: string;
  initialInvoiceNumber: string;
  invoice?: InvoicePreviewData & { id?: string };
};

const noteTools = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: 'List', command: 'insertUnorderedList' },
  { label: '1.', command: 'insertOrderedList' }
] as const;

function createEmptyItem() {
  return {
    id: '',
    itemName: '',
    price: 0,
    quantity: 1,
    unitType: '',
    taxTypeIds: [] as string[],
    taxRate: 0
  };
}

export default function InvoiceEditor({
  mode,
  locale,
  currency,
  initialInvoiceNumber,
  invoice
}: InvoiceEditorProps) {
  const router = useRouter();
  const intlLocale = getIntlLocale(locale);
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<InvoiceEditorValues>({
    resolver: zodResolver(invoiceEditorSchema),
    defaultValues: {
      customerName: invoice?.customerName ?? '',
      customerEmail: invoice?.customerEmail ?? '',
      invoiceDate: invoice?.invoiceDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      invoiceNumber: invoice?.invoiceNumber ?? initialInvoiceNumber,
      discountType: invoice?.discountType ?? 'fixed',
      discountValue: invoice?.discountValue ?? 0,
      items:
        invoice?.items.map((item) => ({
          id: item.id ?? '',
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
          unitType: item.unitType ?? '',
          taxTypeIds: [],
          taxRate: 0
        })) ?? [createEmptyItem()],
      notes: invoice?.notes ?? '',
      templateId: invoice?.templateId ?? 'minimalist'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedCustomerName = watch('customerName');
  const watchedCustomerEmail = watch('customerEmail');
  const watchedInvoiceDate = watch('invoiceDate');
  const watchedInvoiceNumber = watch('invoiceNumber');
  const watchedNotes = watch('notes');
  const watchedItems = watch('items');
  const selectedTemplateId = watch('templateId');
  const selectedDiscountType = watch('discountType');
  const selectedDiscountValue = watch('discountValue');
  const selectedTemplate = invoiceTemplates.find((template) => template.id === selectedTemplateId);
  const totals = calculateInvoiceTotals({
    items: watchedItems,
    invoiceTaxType: 'tax_free',
    taxPerItem: false,
    invoiceTaxRate: 0,
    discountType: selectedDiscountType,
    discountValue: selectedDiscountValue
  });

  const previewInvoice = useMemo<InvoicePreviewData>(() => {
    return {
      id: invoice?.id,
      invoiceNumber: watchedInvoiceNumber,
      invoiceDate: watchedInvoiceDate,
      customerName: watchedCustomerName,
      customerEmail: watchedCustomerEmail,
      taxType: 'tax_free',
      templateId: selectedTemplateId,
      discountType: selectedDiscountType,
      discountValue: selectedDiscountValue,
      discountAmount: totals.discountAmount,
      notes: watchedNotes,
      subtotal: totals.subtotal,
      taxTotal: 0,
      grandTotal: totals.grandTotal,
      items: watchedItems.map((item) => {
        const lineSubtotal = getLineSubtotal(item);

        return {
          ...item,
          taxes: [],
          taxAmount: 0,
          lineSubtotal,
          lineGrandTotal: lineSubtotal,
          taxLabel: null
        };
      })
    };
  }, [
    invoice?.id,
    selectedDiscountType,
    selectedDiscountValue,
    selectedTemplateId,
    totals.discountAmount,
    totals.grandTotal,
    totals.subtotal,
    watchedCustomerEmail,
    watchedCustomerName,
    watchedInvoiceDate,
    watchedInvoiceNumber,
    watchedItems,
    watchedNotes
  ]);

  const submitInvoice = (values: InvoiceEditorValues) => {
    setSubmitError(null);

    startTransition(async () => {
      const actionInput = {
        locale,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        invoiceDate: values.invoiceDate,
        invoiceNumber: values.invoiceNumber,
        taxType: 'tax_free' as const,
        invoiceTaxTypeIds: [],
        items: values.items.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
          unitType: item.unitType,
          taxTypeIds: []
        })),
        notes: values.notes,
        templateId: values.templateId,
        discountType: values.discountType,
        discountValue: values.discountValue,
        taxPerItem: false
      };
      const result =
        mode === 'edit' && invoice?.id
          ? await updateInvoiceAction({
              ...actionInput,
              id: invoice.id
            })
          : await createInvoiceAction(actionInput);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      router.push(`/${locale}/invoices`);
      router.refresh();
    });
  };

  const submitFromPreview = () => {
    setIsPreviewOpen(false);
    void handleSubmit(submitInvoice)();
  };

  return (
    <>
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
        <div>
          <h1 className="page-title">
            {mode === 'edit' ? t('edit_invoice_title') : t('create_invoice_title')}
          </h1>
          <p className="page-subtitle mt-2">
            {mode === 'edit' ? t('edit_invoice_subtitle') : t('create_invoice_subtitle')}
          </p>
        </div>

        <section className="shell-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('customer_invoice_information')}</h2>
              <p className="text-sm">{t('customer_invoice_information_description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="label">{t('customer_name')}</label>
              <input {...register('customerName')} className="input px-4" placeholder={t('placeholders.customer_name')} />
              {errors.customerName && <p className="mt-1 text-xs text-rose-600">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className="label">{t('customer_email')}</label>
              <input {...register('customerEmail')} className="input px-4" placeholder={t('placeholders.customer_email')} />
              {errors.customerEmail && <p className="mt-1 text-xs text-rose-600">{errors.customerEmail.message}</p>}
            </div>
            <div>
              <label className="label">{t('invoice_number')}</label>
              <input {...register('invoiceNumber')} className="input px-4" placeholder="INV-000001" />
              {errors.invoiceNumber && <p className="mt-1 text-xs text-rose-600">{errors.invoiceNumber.message}</p>}
            </div>
            <div>
              <label className="label">{t('invoice_date')}</label>
              <input type="date" {...register('invoiceDate')} className="input px-4" />
              {errors.invoiceDate && <p className="mt-1 text-xs text-rose-600">{errors.invoiceDate.message}</p>}
            </div>
          </div>
        </section>

        <section className="shell-card p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{t('invoice_items')}</h2>
                <p className="text-sm">{t('manual_entry_hint')}</p>
              </div>
            </div>

            <button type="button" onClick={() => append(createEmptyItem())} className="btn btn-secondary">
              <span className="material-symbols-outlined">add</span>
              {t('add_item')}
            </button>
          </div>

          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_100px_60px] gap-3 border-b border-[var(--border)] pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted lg:grid">
            <span>{t('item')}</span>
            <span>{t('unit_type')}</span>
            <span>{t('price')}</span>
            <span>{t('quantity')}</span>
            <span>{t('total')}</span>
            <span>{commonT('actions')}</span>
          </div>

          <div className="mt-4 space-y-4">
            {fields.map((field, index) => {
              const row = watchedItems[index] ?? createEmptyItem();
              const currentLineSubtotal = getLineSubtotal(row);

              return (
                <div
                  key={field.id}
                  className="surface-panel grid grid-cols-1 gap-4 rounded-[24px] p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_100px_60px] lg:items-start"
                >
                  <div>
                    <label className="label lg:hidden">{t('item')}</label>
                    <input
                      {...register(`items.${index}.itemName`)}
                      className="input px-4"
                      placeholder={t('placeholders.item_name')}
                    />
                    {errors.items?.[index]?.itemName && (
                      <p className="mt-1 text-xs text-rose-600">{errors.items[index]?.itemName?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label lg:hidden">{t('unit_type')}</label>
                    <input {...register(`items.${index}.unitType`)} className="input px-4" placeholder={t('placeholders.unit_type')} />
                  </div>

                  <div>
                    <label className="label lg:hidden">{t('price')}</label>
                    <input type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} className="input px-4" />
                  </div>

                  <div>
                    <label className="label lg:hidden">{t('quantity')}</label>
                    <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="input px-4" />
                  </div>

                  <div>
                    <label className="label lg:hidden">{t('total')}</label>
                    <div className="surface-inset rounded-xl px-4 py-2.5 text-sm font-semibold">
                      {formatCurrency(currentLineSubtotal, currency, intlLocale)}
                    </div>
                  </div>

                  <div className="flex items-start justify-end lg:pt-1">
                    <button type="button" onClick={() => remove(index)} className="rounded-xl p-2 text-soft hover:bg-[var(--surface)] hover:text-rose-600">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {errors.items?.message && <p className="text-xs text-rose-600">{errors.items.message}</p>}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-8">
            <section className="shell-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <span className="material-symbols-outlined">sticky_note_2</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('notes')}</h2>
                  <p className="text-sm">{t('notes_description')}</p>
                </div>
              </div>

              <RichTextField
                value={watchedNotes ?? ''}
                onChange={(value) => setValue('notes', value, { shouldDirty: true })}
                placeholder={t('placeholders.notes')}
              />

              <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text)]">{t('invoice_template')}</p>
                    <p className="mt-1 text-xs text-muted">
                      {selectedTemplate ? t(selectedTemplate.titleKey) : t('template')}
                    </p>
                  </div>
                  <button type="button" onClick={() => setIsTemplateSelectorOpen(true)} className="btn btn-secondary px-3 py-2">
                    <span className="material-symbols-outlined">palette</span>
                    {t('invoice_template')}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="shell-card p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{t('totals')}</h2>
                <p className="text-sm">{t('totals_description')}</p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('discount_type')}</label>
                <select {...register('discountType')} className="select px-4">
                  {invoiceDiscountTypes.map((discountType) => (
                    <option key={discountType} value={discountType}>
                      {t(`discount_types.${discountType}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('discount_value')}</label>
                <input type="number" step="0.01" {...register('discountValue', { valueAsNumber: true })} className="input px-4" />
              </div>
            </div>

            <div className="surface-inset rounded-[24px] p-5">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}</span>
                  <span>{formatCurrency(totals.subtotal, currency, intlLocale)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('discount')}</span>
                  <span>-{formatCurrency(totals.discountAmount, currency, intlLocale)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-4 text-lg font-bold">
                  <span>{t('grand_total')}</span>
                  <span>{formatCurrency(totals.grandTotal, currency, intlLocale)}</span>
                </div>
              </div>
            </div>

            {submitError && <div className="alert-error mt-6">{submitError}</div>}

            <div className="mt-6 flex flex-col gap-3">
              <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn btn-secondary w-full justify-center">
                <span className="material-symbols-outlined">visibility</span>
                {t('preview')}
              </button>

              {mode === 'edit' && (
                <button type="button" onClick={() => void handleSubmit(submitInvoice)()} className="btn btn-primary w-full justify-center" disabled={isSaving}>
                  <span className="material-symbols-outlined">save</span>
                  {isSaving ? t('saving') : commonT('save')}
                </button>
              )}

              {mode === 'create' && <p className="text-center text-xs text-muted">{t('create_from_preview_hint')}</p>}
            </div>
          </aside>
        </div>
      </form>

      {isPreviewOpen && (
        <InvoicePreviewModal
          locale={locale}
          currency={currency}
          companyInfo={emptyInvoiceCompanyInfo}
          invoice={previewInvoice}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={mode === 'create' ? submitFromPreview : undefined}
          confirmLabel={mode === 'create' ? t('create_invoice') : undefined}
          isPending={isSaving}
        />
      )}

      {isTemplateSelectorOpen && (
        <InvoiceTemplateSelectorModal
          locale={locale}
          selectedTemplateId={selectedTemplateId as InvoiceTemplateId}
          onSelect={(templateId) => setValue('templateId', templateId, { shouldDirty: true })}
          onClose={() => setIsTemplateSelectorOpen(false)}
        />
      )}
    </>
  );
}

function RichTextField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const applyCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    onChange(editorRef.current?.innerHTML ?? '');
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        {noteTools.map((tool) => (
          <button
            key={tool.command}
            type="button"
            onClick={() => applyCommand(tool.command)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-muted transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-600"
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className="min-h-[220px] px-4 py-4 text-sm leading-7 text-[color:var(--text)] outline-none"
      />
    </div>
  );
}
