'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
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
        <h2 className="text-xl font-bold">Preferences</h2>
        <p className="mt-1 text-sm">Define how dates, language, and financial settings are displayed.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SelectField
          label="Language"
          value={form.language}
          onChange={(value) => updateField('language', value)}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Arabic', value: 'ar' }
          ]}
        />
        <SelectField
          label="Currency"
          value={form.currency}
          onChange={(value) => updateField('currency', value)}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'JOD', value: 'JOD' },
            { label: 'EUR', value: 'EUR' }
          ]}
        />
        <SelectField
          label="Date Format"
          value={form.dateFormat}
          onChange={(value) => updateField('dateFormat', value)}
          options={[
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
          ]}
        />
        <SelectField
          label="Time Zone"
          value={form.timeZone}
          onChange={(value) => updateField('timeZone', value)}
          options={[
            { label: 'Asia/Amman', value: 'Asia/Amman' },
            { label: 'UTC', value: 'UTC' },
            { label: 'Europe/London', value: 'Europe/London' }
          ]}
        />
        <SelectField
          label="Fiscal Year"
          value={form.fiscalYear}
          onChange={(value) => updateField('fiscalYear', value)}
          options={[
            { label: 'January - December', value: 'January - December' },
            { label: 'April - March', value: 'April - March' },
            { label: 'July - June', value: 'July - June' }
          ]}
        />
      </div>

      <div className="mt-6">
        <label className="label">Time Format</label>
        <div className="flex gap-3">
          {[
            { label: '24-hour', value: '24h' },
            { label: '12-hour (AM/PM)', value: '12h' }
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
          {isSaving ? 'Saving...' : 'Save Preferences'}
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
