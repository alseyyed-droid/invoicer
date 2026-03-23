import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import ProfileSettings from '@/components/settings/ProfileSettings';
import CompanySettings from '@/components/settings/CompanySettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import CustomizationSettings from '@/components/settings/CustomizationSettings';
import TaxTypesSettings from '@/components/settings/TaxTypesSettings';
import type { SettingsSectionId } from '@/components/settings/sections';

export default function SettingsLayout({
  locale,
  activeSection,
  isOnboarding,
  user,
  company,
  preferences,
  customization,
  taxTypes
}: {
  locale: string;
  activeSection: SettingsSectionId;
  isOnboarding: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    mobileNumber?: string | null;
  };
  company: {
    companyName?: string | null;
    country?: string | null;
    city?: string | null;
    companyEmail?: string | null;
    address?: string | null;
    postalCode?: string | null;
    companyLogo?: string | null;
    taxPerItem: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    dateFormat: string;
    timeZone: string;
    fiscalYear: string;
    timeFormat: string;
  };
  customization: {
    invoicePrefix: string;
    invoiceSeparator: string;
    invoiceNumberLength: number;
  };
  taxTypes: Array<{
    id: string;
    title: string;
    percentage: number;
    description: string;
  }>;
}) {
  const t = useTranslations('settings');
  let content: ReactNode = null;

  switch (activeSection) {
    case 'profile':
      content = (
        <ProfileSettings
          locale={locale}
          initialName={user.name ?? ''}
          initialEmail={user.email ?? ''}
          initialMobileNumber={user.mobileNumber ?? ''}
        />
      );
      break;
    case 'company':
      content = <CompanySettings locale={locale} initialValues={company} isOnboarding={isOnboarding} />;
      break;
    case 'preferences':
      content = <PreferencesSettings locale={locale} initialValues={preferences} />;
      break;
    case 'customization':
      content = <CustomizationSettings locale={locale} initialValues={customization} />;
      break;
    case 'tax-types':
      content = <TaxTypesSettings locale={locale} initialTaxTypes={taxTypes} />;
      break;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="page-title">{isOnboarding ? t('onboarding_title') : t('title')}</h1>
        <p className="page-subtitle mt-2">
          {isOnboarding
            ? t('onboarding_subtitle')
            : t('subtitle')}
        </p>
      </div>

      <div>{content}</div>
    </div>
  );
}
