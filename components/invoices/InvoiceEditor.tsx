'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal';
import InvoiceTemplateSelectorModal from '@/components/invoices/InvoiceTemplateSelectorModal';
import { createInvoiceAction, updateInvoiceAction } from '@/lib/actions/invoices';
import {
  calculateInvoiceTotals,
  getIntlLocale,
  getLineSubtotal,
  getLineTaxAmount,
  invoiceDiscountTypes,
  invoiceTaxHandlingValues,
  invoiceTemplateIds,
  invoiceTemplates,
  sanitizeNumber,
  type InvoiceCompanyInfo,
  type InvoicePreviewData,
  type InvoiceTaxOption,
  type InvoiceTemplateId,
  type SavedInvoiceItem
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
  taxType: z.enum(invoiceTaxHandlingValues),
  invoiceTaxTypeIds: z.array(z.string()),
  discountType: z.enum(invoiceDiscountTypes),
  discountValue: z.number().finite().min(0),
  items: z
    .array(
      z.object({
        id: z.string(),
        savedItemId: z.string(),
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
  companyInfo: InvoiceCompanyInfo;
  savedItems: SavedInvoiceItem[];
  taxTypes: InvoiceTaxOption[];
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

function createEmptyItem(taxPerItem: boolean) {
  return {
    id: '',
    savedItemId: '',
    itemName: '',
    price: 0,
    quantity: 1,
    unitType: '',
    taxTypeIds: taxPerItem ? [''] as string[] : [] as string[],
    taxRate: 0
  };
}

function findInvoiceLevelTaxTypeIds(
  invoice: InvoicePreviewData | undefined,
  taxTypes: InvoiceTaxOption[],
  taxPerItem: boolean
) {
  if (!invoice || taxPerItem || invoice.taxType !== 'taxable') {
    return [''];
  }

  const firstTaxIds = invoice.items[0]?.taxes?.map((tax) => tax.id).filter(Boolean) as string[] | undefined;
  if (firstTaxIds?.length) {
    return firstTaxIds;
  }

  const firstTaxRate = sanitizeNumber(invoice.items[0]?.taxRate);
  const matchedTaxId = taxTypes.find((taxType) => taxType.percentage === firstTaxRate)?.id;
  return matchedTaxId ? [matchedTaxId] : [''];
}

function getItemTaxRate(taxTypeIds: string[], taxTypes: InvoiceTaxOption[]) {
  return taxTypeIds.reduce(
    (sum, taxTypeId) => sum + (taxTypes.find((taxType) => taxType.id === taxTypeId)?.percentage ?? 0),
    0
  );
}

export default function InvoiceEditor({
  mode,
  locale,
  currency,
  companyInfo,
  savedItems,
  taxTypes,
  initialInvoiceNumber,
  invoice
}: InvoiceEditorProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const taxPerItem = companyInfo.taxPerItem;

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
      taxType: invoice?.taxType ?? 'taxable',
      invoiceTaxTypeIds: findInvoiceLevelTaxTypeIds(invoice, taxTypes, taxPerItem),
      discountType: invoice?.discountType ?? 'fixed',
      discountValue: invoice?.discountValue ?? 0,
      items:
        invoice?.items.map((item) => ({
          id: item.id ?? '',
          savedItemId: item.savedItemId ?? '',
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
          unitType: item.unitType ?? '',
          taxTypeIds: (item.taxes?.map((tax) => tax.id).filter(Boolean) as string[]) ?? [],
          taxRate: item.taxRate
        })) ?? [createEmptyItem(taxPerItem)],
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
  const selectedTaxType = watch('taxType');
  const selectedTemplateId = watch('templateId');
  const selectedInvoiceTaxTypeIds = watch('invoiceTaxTypeIds');
  const selectedDiscountType = watch('discountType');
  const selectedDiscountValue = watch('discountValue');
  const selectedInvoiceTaxRate = selectedInvoiceTaxTypeIds.reduce(
    (sum, taxTypeId) => sum + (taxTypes.find((taxType) => taxType.id === taxTypeId)?.percentage ?? 0),
    0
  );
  const selectedTemplate = invoiceTemplates.find((template) => template.id === selectedTemplateId);
  const totals = calculateInvoiceTotals({
    items: watchedItems,
    invoiceTaxType: selectedTaxType,
    taxPerItem,
    invoiceTaxRate: selectedInvoiceTaxRate,
    discountType: selectedDiscountType,
    discountValue: selectedDiscountValue
  });

  useEffect(() => {
    if (taxPerItem) {
      return;
    }

    watchedItems.forEach((item, index) => {
      if (item.taxTypeIds.length > 0) {
        setValue(`items.${index}.taxTypeIds`, []);
        setValue(`items.${index}.taxRate`, 0);
      }
    });
  }, [setValue, taxPerItem, watchedItems]);

  useEffect(() => {
    if (taxPerItem) {
      return;
    }

    if (selectedTaxType === 'taxable' && selectedInvoiceTaxTypeIds.length === 0) {
      setValue('invoiceTaxTypeIds', ['']);
    }
  }, [selectedInvoiceTaxTypeIds.length, selectedTaxType, setValue, taxPerItem]);

  const previewInvoice = useMemo<InvoicePreviewData>(() => {
    const invoiceTaxes = selectedInvoiceTaxTypeIds
      .map((taxTypeId) => taxTypes.find((taxType) => taxType.id === taxTypeId))
      .filter((tax): tax is InvoiceTaxOption => Boolean(tax));

    return {
      id: invoice?.id,
      invoiceNumber: watchedInvoiceNumber,
      invoiceDate: watchedInvoiceDate,
      customerName: watchedCustomerName,
      customerEmail: watchedCustomerEmail,
      taxType: selectedTaxType,
      templateId: selectedTemplateId,
      discountType: selectedDiscountType,
      discountValue: selectedDiscountValue,
      discountAmount: totals.discountAmount,
      notes: watchedNotes,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      items: watchedItems.map((item) => {
        const taxes = taxPerItem
          ? item.taxTypeIds
              .map((taxTypeId) => taxTypes.find((taxType) => taxType.id === taxTypeId))
              .filter((tax): tax is InvoiceTaxOption => Boolean(tax))
          : selectedTaxType === 'taxable' && invoiceTaxes.length
            ? invoiceTaxes
            : [];
        const lineSubtotal = getLineSubtotal(item);
        const taxAmount = getLineTaxAmount({
          item,
          invoiceTaxType: selectedTaxType,
          taxPerItem,
          invoiceTaxRate: selectedInvoiceTaxRate
        });

        return {
          ...item,
          taxes,
          taxAmount,
          lineSubtotal,
          lineGrandTotal: lineSubtotal + taxAmount,
          taxLabel: taxes.length
            ? taxes.map((tax) => `${tax.title} (${tax.percentage}%)`).join(', ')
            : t('no_tax')
        };
      })
    };
  }, [
    invoice?.id,
    selectedDiscountType,
    selectedDiscountValue,
    selectedInvoiceTaxRate,
    selectedInvoiceTaxTypeIds,
    selectedTaxType,
    selectedTemplateId,
    taxPerItem,
    taxTypes,
    t,
    totals.discountAmount,
    totals.grandTotal,
    totals.subtotal,
    totals.taxTotal,
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
        ...values,
        locale: currentLocale,
        taxPerItem
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

  const openPreview = () => {
    setIsPreviewOpen(true);
  };

  const submitFromPreview = () => {
    setIsPreviewOpen(false);
    void handleSubmit(submitInvoice)();
  };

  const applySavedItem = (index: number, savedItem: SavedInvoiceItem | null) => {
    setValue(`items.${index}.savedItemId`, savedItem?.id ?? '', { shouldDirty: true });

    if (!savedItem) {
      return;
    }

    const defaultTaxIds = savedItem.taxTypeId ? [savedItem.taxTypeId] : [''];
    setValue(`items.${index}.itemName`, savedItem.name, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${index}.price`, savedItem.price, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${index}.unitType`, savedItem.unitType, { shouldDirty: true });
    setValue(`items.${index}.taxTypeIds`, defaultTaxIds, { shouldDirty: true });
    setValue(`items.${index}.taxRate`, getItemTaxRate(defaultTaxIds, taxTypes), { shouldDirty: true });
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
            <div>
              <label className="label">{t('tax_type')}</label>
              <select {...register('taxType')} className="select px-4">
                {invoiceTaxHandlingValues.map((value) => (
                  <option key={value} value={value}>
                    {t(`tax_type_options.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="shell-card p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{t('invoice_items')}</h2>
                <p className="text-sm">{savedItems.length ? t('saved_item_mode') : t('manual_item_mode')}</p>
              </div>
            </div>

            <button type="button" onClick={() => append(createEmptyItem(taxPerItem))} className="btn btn-secondary">
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
              const row = watchedItems[index];
              const currentLineSubtotal = getLineSubtotal(row ?? createEmptyItem(taxPerItem));
              const currentTaxAmount = getLineTaxAmount({
                item: row ?? createEmptyItem(taxPerItem),
                invoiceTaxType: selectedTaxType,
                taxPerItem,
                invoiceTaxRate: selectedInvoiceTaxRate
              });
              const selectedTaxes =
                row?.taxTypeIds
                  .map((taxTypeId) => taxTypes.find((taxType) => taxType.id === taxTypeId))
                  .filter((tax): tax is InvoiceTaxOption => Boolean(tax)) ?? [];
              const taxDisplayLabel = taxPerItem
                ? selectedTaxes.length
                  ? selectedTaxes.map((tax) => `${tax.title} (${tax.percentage}%)`).join(', ')
                  : t('no_tax')
                : selectedTaxType === 'taxable'
                  ? selectedInvoiceTaxTypeIds
                      .map((taxTypeId) => taxTypes.find((taxType) => taxType.id === taxTypeId))
                      .filter((tax): tax is InvoiceTaxOption => Boolean(tax))
                      .map((tax) => `${tax.title} (${tax.percentage}%)`)
                      .join(', ') || t('tax_not_selected')
                  : t(`tax_type_options.${selectedTaxType}`);

              return (
                <div
                  key={field.id}
                  className="surface-panel grid grid-cols-1 gap-4 rounded-[24px] p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_100px_60px] lg:items-start"
                >
                  <div>
                    <label className="label lg:hidden">{t('item')}</label>
                    <ItemSearchField
                      value={row?.itemName ?? ''}
                      savedItems={savedItems}
                      placeholder={t('placeholders.item_search')}
                      onChange={(value) => setValue(`items.${index}.itemName`, value, { shouldDirty: true, shouldValidate: true })}
                      onSelect={(savedItem) => applySavedItem(index, savedItem)}
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
                      {formatCurrency(currentLineSubtotal + currentTaxAmount, currency, intlLocale)}
                    </div>
                  </div>

                  <div className="flex items-start justify-end lg:pt-1">
                    <button type="button" onClick={() => remove(index)} className="rounded-xl p-2 text-soft hover:bg-[var(--surface)] hover:text-rose-600">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  <div className="lg:col-span-6">
                    <label className="label">{t('tax')}</label>
                    {taxPerItem ? (
                      <RepeatableTaxFields
                        options={taxTypes}
                        values={row?.taxTypeIds?.length ? row.taxTypeIds : ['']}
                        selectPlaceholder={t('select_tax_type')}
                        addLabel={t('add_tax')}
                        removeLabel={t('remove_tax')}
                        onChange={(taxTypeIds) => {
                          setValue(`items.${index}.taxTypeIds`, taxTypeIds, { shouldDirty: true });
                          setValue(
                            `items.${index}.taxRate`,
                            getItemTaxRate(taxTypeIds.filter(Boolean), taxTypes),
                            { shouldDirty: true }
                          );
                        }}
                      />
                    ) : (
                      <div className="surface-inset flex h-[42px] items-center rounded-xl px-4 py-2.5 text-sm">
                        {taxDisplayLabel}
                      </div>
                    )}
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

            {!taxPerItem && (
              <div className="mb-5">
                <label className="label">{t('invoice_tax')}</label>
                <RepeatableTaxFields
                  options={taxTypes}
                  values={selectedInvoiceTaxTypeIds.length ? selectedInvoiceTaxTypeIds : ['']}
                  disabled={selectedTaxType !== 'taxable'}
                  selectPlaceholder={selectedTaxType === 'taxable' ? t('select_tax_type') : t('tax_not_applicable')}
                  addLabel={t('add_tax')}
                  removeLabel={t('remove_tax')}
                  onChange={(taxTypeIds) => setValue('invoiceTaxTypeIds', taxTypeIds, { shouldDirty: true })}
                />
              </div>
            )}

            {taxPerItem && (
              <div className="mb-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
                {t('item_tax_notice')}
              </div>
            )}

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
                  <span>{t('tax_total')}</span>
                  <span>{formatCurrency(totals.taxTotal, currency, intlLocale)}</span>
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
              <button type="button" onClick={openPreview} className="btn btn-secondary w-full justify-center">
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
          companyInfo={companyInfo}
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

function ItemSearchField({
  value,
  savedItems,
  placeholder,
  onChange,
  onSelect
}: {
  value: string;
  savedItems: SavedInvoiceItem[];
  placeholder: string;
  onChange: (value: string) => void;
  onSelect: (item: SavedInvoiceItem | null) => void;
}) {
  const t = useTranslations('invoices');
  const [isOpen, setIsOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredItems = savedItems.filter((item) =>
    item.name.toLowerCase().includes(value.trim().toLowerCase())
  );

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          onSelect(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 120);
        }}
        className="input px-4"
        placeholder={placeholder}
      />

      {isOpen && savedItems.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item.name);
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[var(--bg)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text)]">{item.name}</p>
                    <p className="text-xs text-muted">{item.unitType}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600">
                    {item.taxType ? `${item.taxType.title} (${item.taxType.percentage}%)` : t('no_tax')}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-xl px-3 py-3 text-sm text-muted">{t('use_typed_item')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RepeatableTaxFields({
  options,
  values,
  selectPlaceholder,
  addLabel,
  removeLabel,
  disabled = false,
  onChange
}: {
  options: InvoiceTaxOption[];
  values: string[];
  selectPlaceholder: string;
  addLabel: string;
  removeLabel: string;
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  const effectiveValues = values.length ? values : [''];

  return (
      <div className="space-y-2 lg:max-w-[30vw]">
        {effectiveValues.map((value, index) => (
          <div key={`${value}-${index}`} className="flex items-center gap-2">
          <select
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const nextValues = [...effectiveValues];
              nextValues[index] = event.target.value;
              onChange(nextValues);
            }}
            className="select h-[42px] flex-1 px-4"
          >
            <option value="">{selectPlaceholder}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title} ({option.percentage}%)
              </option>
            ))}
          </select>

          {index === effectiveValues.length - 1 && !disabled && (
            <button
              type="button"
              onClick={() => onChange([...effectiveValues, ''])}
              aria-label={addLabel}
              className="btn btn-secondary h-[42px] w-[42px] shrink-0 px-0"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          )}

          {effectiveValues.length > 1 && !disabled && (
            <button
              type="button"
              onClick={() => onChange(effectiveValues.filter((_, valueIndex) => valueIndex !== index))}
              aria-label={removeLabel}
              className="btn btn-secondary h-[42px] w-[42px] shrink-0 px-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50/70"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
