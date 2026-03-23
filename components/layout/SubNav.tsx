'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { settingsSections } from '@/components/settings/sections';

const icons = {
  dashboard: 'dashboard',
  invoices: 'description',
  items: 'inventory_2',
  settings: 'settings'
} as const;

export default function SubNav() {
  const t = useTranslations('common');
  const settingsT = useTranslations('settings');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith(`/${locale}/settings`));

  useEffect(() => {
    if (pathname.startsWith(`/${locale}/settings`)) {
      setSettingsOpen(true);
    }
  }, [locale, pathname]);

  const navItems = [
    { name: t('dashboard'), href: `/${locale}`, icon: icons.dashboard },
    { name: t('invoices'), href: `/${locale}/invoices`, icon: icons.invoices },
    { name: t('items'), href: `/${locale}/items`, icon: icons.items }
  ];

  const settingsHref = `/${locale}/settings?section=profile`;
  const currentSection = searchParams.get('section') ?? 'profile';
  const settingsIsActive = pathname.startsWith(`/${locale}/settings`);

  const handleSettingsClick = () => {
    if (!settingsIsActive) {
      setSettingsOpen(true);
      router.push(settingsHref);
      return;
    }

    setSettingsOpen((current) => !current);
  };

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-inner space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-link', isActive && 'sidebar-link-active')}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          <div className="space-y-1">
            <button
              type="button"
              onClick={handleSettingsClick}
              className={cn(
                'sidebar-link w-full justify-between',
                settingsIsActive && 'sidebar-link-active'
              )}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">{icons.settings}</span>
                {t('settings')}
              </span>
              <span
                className={cn(
                  'material-symbols-outlined !text-[18px] transition-transform',
                  settingsOpen && 'rotate-180'
                )}
              >
                expand_more
              </span>
            </button>

            {settingsOpen && (
              <div className="ml-4 space-y-1 border-l border-[var(--border)] pl-3">
                {settingsSections.map((section) => {
                  const href = `/${locale}/settings?section=${section.id}`;
                  const isActive = settingsIsActive && currentSection === section.id;

                  return (
                    <Link
                      key={section.id}
                      href={href}
                      className={cn(
                        'text-muted flex rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg)] hover:text-[color:var(--text)]',
                        isActive && 'accent-active'
                      )}
                    >
                      {settingsT(section.labelKey)}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="mobile-tabs no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('mobile-tab', isActive && 'mobile-tab-active')}
            >
              {item.name}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleSettingsClick}
          className={cn('mobile-tab', settingsIsActive && 'mobile-tab-active')}
        >
          {t('settings')}
        </button>
      </div>

      {settingsOpen && settingsIsActive && (
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <div className="flex flex-wrap gap-2">
            {settingsSections.map((section) => {
              const href = `/${locale}/settings?section=${section.id}`;
              const isActive = currentSection === section.id;

              return (
                <Link
                  key={section.id}
                  href={href}
                  className={cn(
                    'text-muted rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg)] hover:text-[color:var(--text)]',
                    isActive && 'accent-active-bordered'
                  )}
                >
                  {settingsT(section.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
