import { redirect } from 'next/navigation';
import { getCompanySetupPath, requireAuth } from '@/auth';
import SettingsLayout from '@/components/settings/SettingsLayout';
import { isSettingsSection } from '@/components/settings/sections';
import { prisma } from '@/lib/prisma';
import { ensureUserData } from '@/lib/user-data';

export default async function SettingsPage({
  params,
  searchParams
}: {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { section?: string | string[] | undefined }
    | Promise<{ section?: string | string[] | undefined }>;
}) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const session = await requireAuth(locale, { enforceCompanySetup: false });
  const rawSection = Array.isArray(resolvedSearchParams?.section)
    ? resolvedSearchParams?.section[0]
    : resolvedSearchParams?.section;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      companyInfo: true,
      preferences: true,
      taxTypes: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const { companyInfo, preferences } =
    user.companyInfo && user.preferences
      ? { companyInfo: user.companyInfo, preferences: user.preferences }
      : await ensureUserData(user.id, user.locale ?? locale);
  const hasCompletedSetup = Boolean(companyInfo.companyName?.trim());
  const activeSection = rawSection && isSettingsSection(rawSection)
    ? rawSection
    : hasCompletedSetup
      ? 'profile'
      : 'company';

  if (!hasCompletedSetup && activeSection !== 'company') {
    redirect(getCompanySetupPath(locale));
  }

  return (
    <SettingsLayout
      locale={locale}
      activeSection={activeSection}
      isOnboarding={!hasCompletedSetup}
      user={{
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber
      }}
      company={{
        companyName: companyInfo.companyName,
        country: companyInfo.country,
        city: companyInfo.city,
        companyEmail: companyInfo.companyEmail,
        address: companyInfo.address,
        postalCode: companyInfo.postalCode,
        companyLogo: companyInfo.companyLogo,
        taxPerItem: companyInfo.taxPerItem
      }}
      preferences={{
        language: preferences.language,
        currency: preferences.currency,
        dateFormat: preferences.dateFormat,
        timeZone: preferences.timeZone,
        fiscalYear: preferences.fiscalYear,
        timeFormat: preferences.timeFormat
      }}
      customization={{
        invoicePrefix: preferences.invoicePrefix,
        invoiceSeparator: preferences.invoiceSeparator,
        invoiceNumberLength: preferences.invoiceNumberLength
      }}
      taxTypes={user.taxTypes.map((taxType) => ({
        id: taxType.id,
        title: taxType.title,
        percentage: taxType.percentage,
        description: taxType.description ?? ''
      }))}
    />
  );
}
