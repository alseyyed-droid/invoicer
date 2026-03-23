'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import ItemForm from '@/components/items/ItemForm';
import { updateItemAction } from '@/lib/actions/items';
import { ItemFormValues, ItemRecord, ItemTaxType } from '@/lib/items';

export default function EditItemModal({
  locale,
  item,
  taxTypes,
  onClose,
  onUpdated
}: {
  locale: string;
  item: ItemRecord;
  taxTypes: ItemTaxType[];
  onClose: () => void;
  onUpdated: (item: ItemRecord, message: string) => void;
}) {
  const t = useTranslations('items');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (values: ItemFormValues) => {
    setError(null);

    startTransition(async () => {
      const result = await updateItemAction({
        id: item.id,
        locale,
        ...values
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onUpdated(result.item, t('messages.updated'));
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="shell-card w-full max-w-2xl rounded-[28px] p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t('edit_item')}</h2>
            <p className="mt-1 text-sm">{t('modal_descriptions.edit')}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost h-10 w-10 rounded-full p-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && <div className="alert-error mb-5">{error}</div>}

        <ItemForm
          item={item}
          taxTypes={taxTypes}
          isSubmitting={isPending}
          submitLabel={t('save_item')}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
