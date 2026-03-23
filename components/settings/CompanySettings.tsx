'use client';

import { useState, useTransition, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { saveCompanySettingsAction } from '@/lib/actions/settings';

export default function CompanySettings({
  locale,
  initialValues,
  isOnboarding = false
}: {
  locale: string;
  initialValues: {
    companyName?: string | null;
    country?: string | null;
    city?: string | null;
    companyEmail?: string | null;
    address?: string | null;
    postalCode?: string | null;
    companyLogo?: string | null;
    taxPerItem: boolean;
  };
  isOnboarding?: boolean;
}) {
  const commonT = useTranslations('common');
  const t = useTranslations('settings');
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: initialValues.companyName ?? '',
    country: initialValues.country ?? '',
    city: initialValues.city ?? '',
    companyEmail: initialValues.companyEmail ?? '',
    address: initialValues.address ?? '',
    postalCode: initialValues.postalCode ?? '',
    companyLogo: initialValues.companyLogo ?? '',
    taxPerItem: initialValues.taxPerItem
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result === 'string') {
        setForm((current) => ({ ...current, companyLogo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await saveCompanySettingsAction({
        locale,
        companyName: form.companyName,
        country: form.country,
        city: form.city,
        companyEmail: form.companyEmail,
        address: form.address,
        postalCode: form.postalCode,
        companyLogo: form.companyLogo,
        taxPerItem: form.taxPerItem
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (isOnboarding) {
        router.push(`/${locale}`);
        router.refresh();
        return;
      }

      setMessage(result.message);
    });
  };

  return (
    <section className="shell-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t('company.title')}</h2>
        <p className="mt-1 text-sm">{t('company.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label={t('company.company_name')} value={form.companyName} onChange={(value) => updateField('companyName', value)} />
        <Field label={t('company.country')} value={form.country} onChange={(value) => updateField('country', value)} />
        <Field label={t('company.city')} value={form.city} onChange={(value) => updateField('city', value)} />
        <Field
          label={t('company.company_email')}
          type="email"
          value={form.companyEmail}
          onChange={(value) => updateField('companyEmail', value)}
        />
        <Field label={t('company.address')} value={form.address} onChange={(value) => updateField('address', value)} />
        <Field label={t('company.postal_code')} value={form.postalCode} onChange={(value) => updateField('postalCode', value)} />
        <div className="md:col-span-2">
          <label className="label">{t('company.company_logo_upload')}</label>
          <input type="file" accept="image/*" className="input px-4 pt-2" onChange={handleFileChange} />
          {form.companyLogo && (
            <div className="surface-inset mt-3 flex items-center justify-between rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={form.companyLogo} alt={t('company.company_logo_preview_alt')} className="h-12 w-12 rounded-xl object-cover" />
                <p className="text-sm font-medium text-[color:var(--text)]">{t('company.logo_ready')}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => updateField('companyLogo', '')}>
                {commonT('remove')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="surface-inset mt-6 rounded-2xl px-4 py-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.taxPerItem}
            onChange={() => updateField('taxPerItem', !form.taxPerItem)}
            className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-emerald-500 focus:ring-emerald-500"
          />
          <div>
            <p className="font-semibold text-[color:var(--text)]">{t('company.tax_per_item')}</p>
            <p className="text-muted text-sm">
              {form.taxPerItem
                ? t('company.tax_per_item_enabled')
                : t('company.tax_per_item_disabled')}
            </p>
          </div>
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          <span className="material-symbols-outlined">save</span>
          {isSaving ? t('company.saving') : isOnboarding ? t('company.save_and_continue') : t('company.save')}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input px-4" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
