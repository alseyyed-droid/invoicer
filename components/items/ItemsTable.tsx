'use client';

import { useTranslations } from 'next-intl';
import { getIntlLocale, ItemRecord } from '@/lib/items';
import { formatCurrency } from '@/lib/utils';

export default function ItemsTable({
  locale,
  currency,
  items,
  onEdit,
  onDelete
}: {
  locale: string;
  currency: string;
  items: ItemRecord[];
  onEdit: (item: ItemRecord) => void;
  onDelete: (item: ItemRecord) => void;
}) {
  const t = useTranslations('items');
  const commonT = useTranslations('common');
  const numberLocale = getIntlLocale(locale);

  return (
    <>
      <div className="table-shell hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg)]">
              <tr className="border-b border-[var(--border)]">
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                  {t('name')}
                </th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                  {t('price')}
                </th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                  {t('unit_type')}
                </th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                  {t('tax_type')}
                </th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                  {commonT('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[var(--bg)]">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="tone-emerald mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--text)]">
                          {item.name}
                        </p>
                        <p className="text-soft mt-1 truncate text-xs">
                          {item.description || t('no_description')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[color:var(--text)]">
                    {formatCurrency(item.price, currency, numberLocale)}
                  </td>
                  <td className="text-muted px-5 py-4 text-sm">{t(`units.${item.unitType}`)}</td>
                  <td className="text-muted px-5 py-4 text-sm">
                    {item.taxType ? `${item.taxType.title} (${item.taxType.percentage}%)` : t('no_tax_type')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onEdit(item)} className="btn btn-secondary px-3 py-2">
                        {commonT('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="btn btn-ghost px-3 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        {commonT('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {items.map((item) => (
          <article key={item.id} className="shell-card rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="tone-emerald flex h-11 w-11 items-center justify-center rounded-2xl">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm">
                    {formatCurrency(item.price, currency, numberLocale)}
                  </p>
                </div>
              </div>
              <span className="accent-active inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                {t(`units.${item.unitType}`)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-soft text-xs font-semibold uppercase tracking-[0.08em]">
                  {t('tax_type')}
                </span>
                <span className="text-right text-sm">
                  {item.taxType ? `${item.taxType.title} (${item.taxType.percentage}%)` : t('no_tax_type')}
                </span>
              </div>
              <div>
                <p className="text-soft text-xs font-semibold uppercase tracking-[0.08em]">
                  {t('description')}
                </p>
                <p className="mt-1 text-sm">{item.description || t('no_description')}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => onEdit(item)} className="btn btn-secondary flex-1">
                {commonT('edit')}
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="btn flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                {commonT('delete')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
