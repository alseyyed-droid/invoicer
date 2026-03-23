import { redirect } from 'next/navigation';
import { auth, getAuthenticatedHomePath } from '@/auth';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default async function ForgotPasswordPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await auth();

  if (session?.user?.id) {
    redirect(await getAuthenticatedHomePath(session.user.id, locale));
  }

  return <ForgotPasswordForm locale={locale} />;
}
