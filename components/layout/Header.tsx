'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import UserAvatarDropdown from '@/components/layout/UserAvatarDropdown';

export default function Header({
  locale,
  userName,
  userEmail
}: {
  locale: string;
  userName: string;
  userEmail?: string | null;
}) {
  const t = useTranslations('common');

  return (
    <header className="topbar shrink-0">
      <div className="topbar-inner">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}/invoices`} className="flex items-center gap-2.5">
            <div className="brand-mark">
              <span className="material-symbols-outlined !text-[16px]">receipt_long</span>
            </div>
            <h2 className="text-[15px] font-bold tracking-tight">InvoiceGen</h2>
          </Link>

          <div className="hidden w-[242px] sm:block">
            <div className="group relative">
              <div className="text-soft pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 group-focus-within:text-emerald-500">
                <span className="material-symbols-outlined !text-[18px]">search</span>
              </div>
              <input
                type="text"
                placeholder={t('search')}
                className="input py-2 pl-10 pr-4 hover:bg-[var(--surface)] focus:bg-[var(--surface)]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/${locale}/invoices/new`} className="btn btn-primary h-10 px-4">
            <span className="material-symbols-outlined !text-[18px]">add</span>
            <span className="hidden sm:inline">{t('create_invoice')}</span>
          </Link>

          <div className="ml-1 flex items-center gap-3 border-l border-[var(--border)] pl-4">
            <button className="text-soft rounded-lg p-2 transition-colors hover:bg-[var(--bg)]">
              <span className="material-symbols-outlined !text-[18px]">notifications</span>
            </button>

            <UserAvatarDropdown locale={locale} userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
