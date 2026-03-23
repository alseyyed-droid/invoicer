'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { savePreferencesSettingsAction } from '@/lib/actions/settings';

export default function PreferencesSettings({
  locale,
  initialValues
}: {
  locale: string;
  initialValues: {
    language: string;
    currency: string;
    dateFormat: string;
    timeZone: string;
    fiscalYear: string;
    timeFormat: string;
  };
}) {
  const commonT = useTranslations('common');
  const t = useTranslations('settings');
  const router = useRouter();
  const pathname = usePathname();
  const [isSaving, startTransition] = useTransition();
  const [form, setForm] = useState({
    language: initialValues.language,
    currency: initialValues.currency,
    dateFormat: initialValues.dateFormat,
    timeZone: initialValues.timeZone,
    fiscalYear: initialValues.fiscalYear,
    timeFormat: initialValues.timeFormat
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await savePreferencesSettingsAction({
        locale,
        language: form.language as 'en' | 'ar',
        currency: form.currency,
        dateFormat: form.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
        timeZone: form.timeZone,
        fiscalYear: form.fiscalYear as 'January - December' | 'April - March' | 'July - June',
        timeFormat: form.timeFormat as '24h' | '12h'
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      const nextPath = pathname.replace(/^\/(en|ar)/, `/${result.nextLocale}`);
      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <section className="shell-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t('preferences.title')}</h2>
        <p className="mt-1 text-sm">{t('preferences.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SelectField
          label={t('preferences.language')}
          value={form.language}
          onChange={(value) => updateField('language', value)}
          options={[
            { label: commonT('english'), value: 'en' },
            { label: commonT('arabic'), value: 'ar' }
          ]}
        />
        <SelectField
          label={t('preferences.currency')}
          value={form.currency}
          onChange={(value) => updateField('currency', value)}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'JOD', value: 'JOD' },
            { label: 'EUR', value: 'EUR' }
          ]}
        />
        <SelectField
          label={t('preferences.date_format')}
          value={form.dateFormat}
          onChange={(value) => updateField('dateFormat', value)}
          options={[
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
          ]}
        />
        <SelectField
          label={t('preferences.time_zone')}
          value={form.timeZone}
          onChange={(value) => updateField('timeZone', value)}
          options={[
            { label: 'Asia/Amman', value: 'Asia/Amman' },
            { label: 'UTC', value: 'UTC' },
            { label: 'Europe/London', value: 'Europe/London' }
          ]}
        />
        <SelectField
          label={t('preferences.fiscal_year')}
          value={form.fiscalYear}
          onChange={(value) => updateField('fiscalYear', value)}
          options={[
            { label: t('preferences.options.fiscal_years.january_december'), value: 'January - December' },
            { label: t('preferences.options.fiscal_years.april_march'), value: 'April - March' },
            { label: t('preferences.options.fiscal_years.july_june'), value: 'July - June' }
          ]}
        />
      </div>

      <div className="mt-6">
        <label className="label">{t('preferences.time_format')}</label>
        <div className="flex gap-3">
          {[
            { label: t('preferences.options.time_formats.24h'), value: '24h' },
            { label: t('preferences.options.time_formats.12h'), value: '12h' }
          ].map((option) => (
            <label
              key={option.value}
              className="text-muted flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
            >
              <input
                type="radio"
                name="timeFormat"
                checked={form.timeFormat === option.value}
                onChange={() => updateField('timeFormat', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          <span className="material-symbols-outlined">save</span>
          {isSaving ? t('preferences.saving') : t('preferences.save')}
        </button>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select px-4" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
