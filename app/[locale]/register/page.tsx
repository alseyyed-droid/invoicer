import { redirect } from 'next/navigation';
import { auth, getAuthenticatedHomePath } from '@/auth';
import RegisterForm from '@/components/auth/RegisterForm';

export default async function RegisterPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await auth();

  if (session?.user?.id) {
    redirect(await getAuthenticatedHomePath(session.user.id, locale));
  }

  return <RegisterForm locale={locale} />;
}
