import { redirect } from 'next/navigation';
import { auth, getAuthenticatedHomePath } from '@/auth';

export default async function RootPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/en/login');
  }

  redirect(await getAuthenticatedHomePath(session.user.id, 'en'));
}
