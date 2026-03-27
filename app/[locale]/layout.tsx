import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import SubNav from '@/components/layout/SubNav';
import { auth } from '@/auth';

const locales = ['en', 'ar'] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const session = await auth();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={direction} className="app-shell">
        {session ? (
          <>
            <Header
              locale={locale}
              userName={session.user?.name ?? 'Admin User'}
              userEmail={session.user?.email}
            />
            <div className="flex flex-1 overflow-hidden">
              <SubNav />
              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[980px] px-7 py-6">{children}</div>
              </main>
            </div>
          </>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </div>
    </NextIntlClientProvider>
  );
}
