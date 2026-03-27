import { redirect } from 'next/navigation';
import { requireAuth } from '@/auth';

export default async function DashboardPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  await requireAuth(locale);

  redirect(`/${locale}/invoices`);
}
