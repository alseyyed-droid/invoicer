import { redirect } from 'next/navigation';
import { auth, getAuthenticatedHomePath } from '@/auth';
import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage({
  params
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  const session = await auth();

  if (session?.user?.id) {
    redirect(await getAuthenticatedHomePath(session.user.id, locale));
  }

  return <LoginForm locale={locale} />;
}
