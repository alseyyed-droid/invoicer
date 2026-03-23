'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ItemFormValues, ItemRecord, ItemTaxType, itemUnitTypes } from '@/lib/items';

function createItemFormSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    name: z.string().trim().min(1, t('validation.name_required')).max(191),
    price: z
      .number({
        error: t('validation.price_required')
      })
      .refine((value) => Number.isFinite(value), t('validation.price_required'))
      .min(0, t('validation.price_invalid')),
    unitType: z.enum(itemUnitTypes, {
      error: t('validation.unit_type_required')
    }),
    description: z.string().max(5000),
    taxTypeId: z.string()
  });
}

function getDefaultValues(item?: ItemRecord | null): ItemFormValues {
  return {
    name: item?.name ?? '',
    price: item?.price ?? 0,
    unitType: item?.unitType ?? 'piece',
    description: item?.description ?? '',
    taxTypeId: item?.taxTypeId ?? ''
  };
}

export default function ItemForm({
  item,
  taxTypes,
  isSubmitting,
  submitLabel,
  onCancel,
  onSubmit
}: {
  item?: ItemRecord | null;
  taxTypes: ItemTaxType[];
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => void;
}) {
  const t = useTranslations('items');
  const commonT = useTranslations('common');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ItemFormValues>({
    resolver: zodResolver(createItemFormSchema(t)),
    defaultValues: getDefaultValues(item)
  });

  useEffect(() => {
    reset(getDefaultValues(item));
  }, [item, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">{t('name')}</label>
          <input
            {...register('name')}
            className="input px-4"
            placeholder={t('placeholders.name')}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">{t('price')}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('price', { valueAsNumber: true })}
            className="input px-4"
            placeholder="0.00"
          />
          {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price.message}</p>}
        </div>

        <div>
          <label className="label">{t('unit_type')}</label>
          <select {...register('unitType')} className="select px-4">
            {itemUnitTypes.map((unitType) => (
              <option key={unitType} value={unitType}>
                {t(`units.${unitType}`)}
              </option>
            ))}
          </select>
          {errors.unitType && (
            <p className="mt-1 text-xs text-rose-600">{errors.unitType.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('tax_type')}</label>
          <select {...register('taxTypeId')} className="select px-4">
            <option value="">{t('no_tax_type')}</option>
            {taxTypes.map((taxType) => (
              <option key={taxType.id} value={taxType.id}>
                {taxType.title} ({taxType.percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('description')}</label>
          <textarea
            {...register('description')}
            className="textarea min-h-[120px] px-4"
            placeholder={t('placeholders.description')}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {commonT('cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t('saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
