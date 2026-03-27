import { requireAuth } from '@/auth';
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
  const session = await requireAuth(locale);
  const rawSection = Array.isArray(resolvedSearchParams?.section)
    ? resolvedSearchParams?.section[0]
    : resolvedSearchParams?.section;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      preferences: true
    }
  });

  if (!user) {
    return null;
  }

  const { preferences } = user.preferences
    ? { preferences: user.preferences }
    : await ensureUserData(user.id, user.locale ?? locale);
  const activeSection = rawSection && isSettingsSection(rawSection)
    ? rawSection
    : 'profile';

  return (
    <SettingsLayout
      locale={locale}
      activeSection={activeSection}
      user={{
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber
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
    />
  );
}
