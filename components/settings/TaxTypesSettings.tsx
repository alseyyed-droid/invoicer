'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  createTaxTypeAction,
  deleteTaxTypeAction,
  updateTaxTypeAction
} from '@/lib/actions/settings';

type TaxType = {
  id: string;
  title: string;
  percentage: number;
  description: string;
};

export default function TaxTypesSettings({
  locale,
  initialTaxTypes
}: {
  locale: string;
  initialTaxTypes: TaxType[];
}) {
  const commonT = useTranslations('common');
  const t = useTranslations('settings');
  const [taxTypes, setTaxTypes] = useState<TaxType[]>(initialTaxTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const [form, setForm] = useState<TaxType>({
    id: '',
    title: '',
    percentage: 0,
    description: ''
  });

  const openCreate = () => {
    setEditingId(null);
    setError(null);
    setForm({ id: '', title: '', percentage: 0, description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (taxType: TaxType) => {
    setEditingId(taxType.id);
    setForm(taxType);
    setIsModalOpen(true);
  };

  const saveTaxType = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const payload = {
        locale,
        title: form.title,
        percentage: Number(form.percentage),
        description: form.description
      };

      const result = editingId
        ? await updateTaxTypeAction({ ...payload, id: editingId })
        : await createTaxTypeAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTaxTypes((current) => {
        if (editingId) {
          return current.map((item) => (item.id === result.taxType.id ? result.taxType : item));
        }

        return [result.taxType, ...current];
      });
      setMessage(result.message);
      setIsModalOpen(false);
    });
  };

  const deleteTaxType = (id: string) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteTaxTypeAction({ id, locale });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTaxTypes((current) => current.filter((item) => item.id !== id));
      setMessage(result.message);
    });
  };

  return (
    <section className="space-y-6">
      <div className="shell-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('tax_types.title')}</h2>
            <p className="mt-1 text-sm">{t('tax_types.subtitle')}</p>
          </div>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            {t('tax_types.add')}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg)]">
              <tr className="border-b border-[var(--border)]">
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">{commonT('title')}</th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">{commonT('percentage')}</th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">{commonT('description')}</th>
                <th className="text-muted px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">{commonT('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {taxTypes.map((taxType) => (
                <tr key={taxType.id}>
                  <td className="px-5 py-4 text-sm font-semibold text-[color:var(--text)]">{taxType.title}</td>
                  <td className="text-muted px-5 py-4 text-sm">{taxType.percentage}%</td>
                  <td className="text-muted px-5 py-4 text-sm">{taxType.description}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(taxType)}
                        className="btn btn-secondary"
                        disabled={isSaving}
                      >
                        {commonT('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTaxType(taxType.id)}
                        className="btn btn-ghost text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={isSaving}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="shell-card w-full max-w-xl rounded-3xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{editingId ? t('tax_types.edit_title') : t('tax_types.add_title')}</h3>
                <p className="mt-1 text-sm">{t('tax_types.modal_subtitle')}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <Field label={commonT('title')} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
              <Field
                label={commonT('percentage')}
                value={String(form.percentage)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    percentage: Number(value)
                  }))
                }
              />
              <div>
                <label className="label">{commonT('description')}</label>
                <textarea
                  className="textarea min-h-[120px] px-4"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                {commonT('cancel')}
              </button>
              <button type="button" onClick={saveTaxType} className="btn btn-primary" disabled={isSaving}>
                {isSaving ? t('tax_types.saving') : t('tax_types.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input px-4" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
