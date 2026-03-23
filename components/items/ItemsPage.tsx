'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CreateItemModal from '@/components/items/CreateItemModal';
import DeleteItemConfirmation from '@/components/items/DeleteItemConfirmation';
import EditItemModal from '@/components/items/EditItemModal';
import ItemsTable from '@/components/items/ItemsTable';
import { ItemRecord, ItemTaxType } from '@/lib/items';

export default function ItemsPage({
  locale,
  currency,
  initialItems,
  taxTypes
}: {
  locale: string;
  currency: string;
  initialItems: ItemRecord[];
  taxTypes: ItemTaxType[];
}) {
  const t = useTranslations('items');
  const [items, setItems] = useState<ItemRecord[]>(initialItems);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreated = (item: ItemRecord, nextMessage: string) => {
    setItems((current) => [item, ...current]);
    setMessage(nextMessage);
  };

  const handleUpdated = (item: ItemRecord, nextMessage: string) => {
    setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? item : currentItem)));
    setMessage(nextMessage);
  };

  const handleDeleted = (itemId: string, nextMessage: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setMessage(nextMessage);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle mt-2">{t('subtitle')}</p>
        </div>

        <button type="button" onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          <span className="material-symbols-outlined">add</span>
          {t('add_item')}
        </button>
      </div>

      {message && <div className="alert-success">{message}</div>}

      {items.length === 0 ? (
        <section className="shell-card rounded-[28px] px-6 py-14 text-center shadow-[0_14px_30px_rgba(16,185,129,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined !text-[30px]">inventory_2</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold">{t('empty_title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm">{t('empty_description')}</p>
          <button type="button" onClick={() => setIsCreateOpen(true)} className="btn btn-primary mt-6">
            <span className="material-symbols-outlined">add</span>
            {t('create_first_item')}
          </button>
        </section>
      ) : (
        <ItemsTable
          locale={locale}
          currency={currency}
          items={items}
          onEdit={setEditingItem}
          onDelete={setDeletingItem}
        />
      )}

      {isCreateOpen && (
        <CreateItemModal
          locale={locale}
          taxTypes={taxTypes}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {editingItem && (
        <EditItemModal
          locale={locale}
          item={editingItem}
          taxTypes={taxTypes}
          onClose={() => setEditingItem(null)}
          onUpdated={handleUpdated}
        />
      )}

      {deletingItem && (
        <DeleteItemConfirmation
          locale={locale}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
