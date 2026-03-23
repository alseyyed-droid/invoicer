'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { saveCustomizationSettingsAction } from '@/lib/actions/settings';

export default function CustomizationSettings({
  locale,
  initialValues
}: {
  locale: string;
  initialValues: {
    invoicePrefix: string;
    invoiceSeparator: string;
    invoiceNumberLength: number;
  };
}) {
  const t = useTranslations('settings');
  const [prefix, setPrefix] = useState(initialValues.invoicePrefix);
  const [separator, setSeparator] = useState(initialValues.invoiceSeparator);
  const [length, setLength] = useState(String(initialValues.invoiceNumberLength));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  const preview = useMemo(() => {
    const digits = Number(length) || 6;
    return `${prefix}${separator}${'1'.padStart(digits, '0')}`;
  }, [length, prefix, separator]);

  const handleSave = () => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await saveCustomizationSettingsAction({
        locale,
        invoicePrefix: prefix,
        invoiceSeparator: separator,
        invoiceNumberLength: Number(length)
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
    });
  };

  return (
    <section className="shell-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t('customization.title')}</h2>
        <p className="mt-1 text-sm">{t('customization.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label className="label">{t('customization.invoice_prefix')}</label>
          <input className="input px-4" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('customization.invoice_separator')}</label>
          <input className="input px-4" value={separator} onChange={(e) => setSeparator(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('customization.invoice_number_length')}</label>
          <input className="input px-4" value={length} onChange={(e) => setLength(e.target.value)} />
        </div>
      </div>

      <div className="accent-active-bordered mt-6 rounded-2xl px-5 py-4">
        <p className="text-sm font-medium text-emerald-700">{t('customization.preview')}</p>
        <p className="mt-1 text-2xl font-bold tracking-[0.2em] text-emerald-600">{preview}</p>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          <span className="material-symbols-outlined">save</span>
          {isSaving ? t('customization.saving') : t('customization.save')}
        </button>
      </div>
    </section>
  );
}
