'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function UserAvatarDropdown({
  locale,
  userName,
  userEmail
}: {
  locale: string;
  userName: string;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const initials = useMemo(() => {
    return userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [userName]);

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem('theme');
    const resolvedTheme = storedTheme === 'dark' ? 'dark' : 'light';

    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme !== 'dark');
    setTheme(resolvedTheme);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const switchLanguage = (nextLocale: string) => {
    setIsOpen(false);
    router.push(pathname.replace(/^\/(en|ar)/, `/${nextLocale}`));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    root.classList.toggle('dark', nextTheme === 'dark');
    root.classList.toggle('light', nextTheme !== 'dark');
    window.localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#f4dccf] text-[11px] font-bold text-[#82573f] ring-1 ring-[#ead4c8]"
      >
        {initials || 'A'}
      </button>

      {isOpen && (
        <div className="shell-card absolute end-0 top-full mt-2 w-72 p-3 shadow-lg">
          <div className="border-b border-[var(--border)] px-2 pb-3">
            <p className="text-[color:var(--text)] text-sm font-semibold">{userName}</p>
            {userEmail && <p className="text-muted mt-1 text-xs">{userEmail}</p>}
          </div>

          <div className="space-y-2 px-2 py-3">
            <Link
              href={`/${locale}/settings`}
              className="text-muted flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg)]"
            >
              <span className="material-symbols-outlined">settings</span>
              Settings
            </Link>

            <div className="surface-inset rounded-xl px-3 py-3">
              <label className="text-muted mb-2 block text-xs font-semibold uppercase tracking-[0.08em]">
                Language
              </label>
              <select
                className="select px-4"
                value={locale}
                onChange={(event) => switchLanguage(event.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="text-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg)]"
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
