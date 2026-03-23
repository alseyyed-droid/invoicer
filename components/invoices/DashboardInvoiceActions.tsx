'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import DeleteInvoiceConfirmation from '@/components/invoices/DeleteInvoiceConfirmation';
import type { InvoiceSummaryRecord } from '@/lib/invoices';

type DashboardInvoiceActionsProps = {
  locale: string;
  invoice: InvoiceSummaryRecord;
};

export default function DashboardInvoiceActions({
  locale,
  invoice
}: DashboardInvoiceActionsProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // calculate position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;

      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - menuWidth
      });
    }
  }, [isOpen]);

  // close on outside click + escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-soft rounded-lg p-2 transition-colors hover:bg-[var(--bg)] hover:text-emerald-500"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {isMounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-32 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
            style={{
              top: position.top,
              left: position.left
            }}
            role="menu"
          >

            <Link
              href={`/${locale}/invoices/${invoice.id}`}
              className="block px-4 py-3 text-sm text-[color:var(--text)] transition hover:bg-[var(--bg)]"
              onClick={() => setIsOpen(false)}
            >
              {t('view')}
            </Link>

            <Link
              href={`/${locale}/invoices/${invoice.id}/edit`}
              className="block px-4 py-3 text-sm text-[color:var(--text)] transition hover:bg-[var(--bg)]"
              onClick={() => setIsOpen(false)}
            >
              {commonT('edit')}
            </Link>

            <Link
              href={`/${locale}/invoices/${invoice.id}/clone`}
              className="block px-4 py-3 text-sm text-[color:var(--text)] transition hover:bg-[var(--bg)]"
              onClick={() => setIsOpen(false)}
            >
              {t('clone')}
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsDeleteOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              {commonT('delete')}
            </button>
          </div>,
          document.body
        )}

      {isDeleteOpen && (
        <DeleteInvoiceConfirmation
          locale={locale}
          invoice={invoice}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={() => router.refresh()}
        />
      )}
    </>
  );
}
