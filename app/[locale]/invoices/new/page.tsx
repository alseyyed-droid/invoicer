import CreateInvoicePage from '@/components/invoices/CreateInvoicePage';
import { requireAuth } from '@/auth';
import { ensureUserData, getNextInvoiceNumber } from '@/lib/user-data';

export default async function NewInvoiceRoute({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await requireAuth(locale);
  const [{ preferences }, initialInvoiceNumber] = await Promise.all([
    ensureUserData(session.user.id, locale),
    getNextInvoiceNumber(session.user.id, locale)
  ]);

  return (
    <CreateInvoicePage
      locale={locale}
      currency={preferences.currency}
      initialInvoiceNumber={initialInvoiceNumber}
    />
  );
}
