'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DeleteInvoiceConfirmation from '@/components/invoices/DeleteInvoiceConfirmation';
import InvoiceDocument from '@/components/invoices/InvoiceDocument';
import { getInvoicePdfFilename, type InvoiceCompanyInfo, type InvoiceSummaryRecord } from '@/lib/invoices';

function serializeError(error: unknown) {
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    value: error
  };
}

type InvoiceViewPageProps = {
  locale: string;
  currency: string;
  companyInfo: InvoiceCompanyInfo;
  invoice: InvoiceSummaryRecord;
  publicSharePath?: string | null;
  pdfDownloadPath?: string | null;
  isPublicView?: boolean;
};

export default function InvoiceViewPage({
  locale,
  currency,
  companyInfo,
  invoice,
  publicSharePath,
  pdfDownloadPath,
  isPublicView = false
}: InvoiceViewPageProps) {
  const t = useTranslations('invoices');
  const commonT = useTranslations('common');
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPdfAction, setPendingPdfAction] = useState<'share' | 'download' | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const logShareTrace = (stage: string, details?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    console.info(`[InvoiceShare] ${stage} ${JSON.stringify(details ?? {})}`);
  };

  const logShareError = (stage: string, error: unknown, details?: Record<string, unknown>) => {
    console.error(
      `[InvoiceShare] ${stage} ${JSON.stringify({
        ...(details ?? {}),
        error: serializeError(error)
      })}`
    );
  };

  const createPdfFile = async () => {
    if (!pdfDownloadPath) {
      throw new Error('PDF download path is not available.');
    }

    logShareTrace('create_pdf:start', {
      invoiceNumber: invoice.invoiceNumber,
      templateId: invoice.templateId,
      pdfDownloadPath
    });

    const response = await fetch(pdfDownloadPath, {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`PDF request failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    const filenameHeader = response.headers.get('content-disposition');
    const filenameMatch = filenameHeader?.match(/filename="([^"]+)"/i);
    const filename = filenameMatch?.[1] ?? getInvoicePdfFilename(invoice.invoiceNumber);

    logShareTrace('create_pdf:success', {
      invoiceNumber: invoice.invoiceNumber,
      size: blob.size,
      type: blob.type,
      filename
    });

    return new File([blob], filename, { type: blob.type || 'application/pdf' });
  };

  const downloadPdfFile = async (file?: File) => {
    const resolvedFile = file ?? (await createPdfFile());
    const objectUrl = URL.createObjectURL(resolvedFile);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = resolvedFile.name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    logShareTrace('download_pdf:success', {
      filename: resolvedFile.name,
      size: resolvedFile.size
    });
  };

  const handleShare = async () => {
    setMessage(null);

    try {
      setPendingPdfAction('share');
      const pdfFile = await createPdfFile();
      const canUseNavigatorShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      const canShareFiles =
        canUseNavigatorShare && typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [pdfFile] })
          : false;

      logShareTrace('share:capabilities', {
        canUseNavigatorShare,
        canShareFiles,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });

      if (canUseNavigatorShare && canShareFiles) {
        try {
          logShareTrace('share:native:start', {
            filename: pdfFile.name,
            size: pdfFile.size
          });
          await navigator.share({
            title: invoice.invoiceNumber,
            text: t('share_invoice_text', { invoiceNumber: invoice.invoiceNumber }),
            files: [pdfFile]
          });
          logShareTrace('share:native:success', {
            filename: pdfFile.name
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            logShareTrace('share:native:cancelled', {
              filename: pdfFile.name
            });
            return;
          }

          logShareError('share:native:failed', error, {
            filename: pdfFile.name,
            size: pdfFile.size
          });
        }
      }

      logShareTrace('share:fallback_to_download', {
        filename: pdfFile.name,
        size: pdfFile.size
      });
      await downloadPdfFile(pdfFile);
    } catch (error) {
      logShareError('share:failed', error, {
        invoiceNumber: invoice.invoiceNumber
      });
      setMessage(t('pdf_share_unavailable'));
    } finally {
      setPendingPdfAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setMessage(null);

    try {
      setPendingPdfAction('download');
      await downloadPdfFile();
    } catch (error) {
      logShareError('download:failed', error, {
        invoiceNumber: invoice.invoiceNumber
      });
      setMessage(t('pdf_download_unavailable'));
    } finally {
      setPendingPdfAction(null);
    }
  };

  return (
    <div className="invoice-view-shell space-y-6 print:space-y-0">
      <div className="print-hidden flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-title">
            {isPublicView ? t('shared_invoice_title') : t('invoice_preview_page_title')}
          </h1>
          <p className="page-subtitle mt-2">
            {isPublicView ? t('shared_invoice_subtitle') : t('invoice_preview_page_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isPublicView && (
            <Link href={`/${locale}/invoices`} className="btn btn-secondary">
              <span className="material-symbols-outlined">arrow_back</span>
              {t('back_to_invoices')}
            </Link>
          )}

          {!isPublicView && (
            <Link href={`/${locale}/invoices/${invoice.id}/edit`} className="btn btn-secondary">
              <span className="material-symbols-outlined">edit</span>
              {commonT('edit')}
            </Link>
          )}

          {!isPublicView && (
            <Link href={`/${locale}/invoices/${invoice.id}/clone`} className="btn btn-secondary">
              <span className="material-symbols-outlined">content_copy</span>
              {t('clone')}
            </Link>
          )}

          {!isPublicView && (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="btn bg-rose-600 text-white hover:bg-rose-700"
            >
              <span className="material-symbols-outlined">delete</span>
              {commonT('delete')}
            </button>
          )}

          <button type="button" onClick={() => void handleShare()} className="btn btn-secondary">
            <span className="material-symbols-outlined">share</span>
            {pendingPdfAction === 'share' ? t('saving') : t('share')}
          </button>

          <button type="button" onClick={() => void handleDownloadPdf()} className="btn btn-primary">
            <span className="material-symbols-outlined">download</span>
            {pendingPdfAction === 'download' ? t('saving') : t('download_pdf')}
          </button>
        </div>
      </div>

      {message && <div className="print-hidden alert-success">{message}</div>}

      <div>
        <InvoiceDocument locale={locale} currency={currency} companyInfo={companyInfo} invoice={invoice} />
      </div>

      {isDeleteOpen && !isPublicView && (
        <DeleteInvoiceConfirmation
          locale={locale}
          invoice={invoice}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={() => {
            router.push(`/${locale}/invoices`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
