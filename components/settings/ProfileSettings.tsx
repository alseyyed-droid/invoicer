'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { changePasswordAction, saveProfileSettingsAction } from '@/lib/actions/settings';

export default function ProfileSettings({
  locale,
  initialName,
  initialEmail,
  initialMobileNumber
}: {
  locale: string;
  initialName: string;
  initialEmail: string;
  initialMobileNumber: string;
}) {
  const router = useRouter();
  const commonT = useTranslations('common');
  const t = useTranslations('settings');
  const [form, setForm] = useState({
    name: initialName,
    email: initialEmail,
    mobile: initialMobileNumber,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingProfile, startProfileTransition] = useTransition();
  const [isSavingPassword, startPasswordTransition] = useTransition();

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    setProfileError(null);
    setProfileMessage(null);

    startProfileTransition(async () => {
      const result = await saveProfileSettingsAction({
        locale,
        name: form.name,
        email: form.email,
        mobileNumber: form.mobile
      });

      if (!result.success) {
        setProfileError(result.error);
        return;
      }

      setProfileMessage(result.message);
      router.refresh();
    });
  };

  const handlePasswordSave = () => {
    setPasswordError(null);
    setPasswordMessage(null);

    startPasswordTransition(async () => {
      const result = await changePasswordAction({
        locale,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });

      if (!result.success) {
        setPasswordError(result.error);
        return;
      }

      setPasswordMessage(result.message);
      setForm((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    });
  };

  return (
    <div className="space-y-6">
      <section className="shell-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{t('profile.title')}</h2>
          <p className="mt-1 text-sm">{t('profile.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="label">{commonT('name')}</label>
            <input className="input px-4" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div>
            <label className="label">{commonT('email')}</label>
            <input
              type="email"
              className="input px-4"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('profile.mobile_number')}</label>
            <input
              className="input px-4"
              value={form.mobile}
              onChange={(e) => updateField('mobile', e.target.value)}
            />
          </div>
        </div>

        {profileError && <p className="mt-3 text-sm text-rose-600">{profileError}</p>}
        {profileMessage && <p className="mt-3 text-sm text-emerald-600">{profileMessage}</p>}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSavingProfile}>
            <span className="material-symbols-outlined">save</span>
            {isSavingProfile ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </section>

      <section className="shell-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{t('password.title')}</h2>
          <p className="mt-1 text-sm">{t('password.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className="label">{t('password.current_password')}</label>
            <input
              type="password"
              className="input px-4"
              value={form.currentPassword}
              onChange={(e) => updateField('currentPassword', e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('password.new_password')}</label>
            <input
              type="password"
              className="input px-4"
              value={form.newPassword}
              onChange={(e) => updateField('newPassword', e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('password.confirm_password')}</label>
            <input
              type="password"
              className="input px-4"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
            />
          </div>
        </div>

        {passwordError && <p className="mt-3 text-sm text-rose-600">{passwordError}</p>}
        {passwordMessage && <p className="mt-3 text-sm text-emerald-600">{passwordMessage}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handlePasswordSave}
            className="btn btn-secondary"
            disabled={isSavingPassword}
          >
            <span className="material-symbols-outlined">password</span>
            {isSavingPassword ? t('password.updating') : t('password.update')}
          </button>
        </div>
      </section>
    </div>
  );
}
