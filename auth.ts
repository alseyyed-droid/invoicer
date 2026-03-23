import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export function getCompanySetupPath(locale: string = 'en') {
  return `/${locale}/settings?section=company`;
}

export function getDashboardPath(locale: string = 'en') {
  return `/${locale}`;
}

export async function hasCompletedCompanySetup(userId: string) {
  const companyInfo = await prisma.companyInfo.findUnique({
    where: { userId },
    select: { companyName: true }
  });

  return Boolean(companyInfo?.companyName?.trim());
}

export async function getAuthenticatedHomePath(userId: string, locale: string = 'en') {
  const hasCompletedSetup = await hasCompletedCompanySetup(userId);

  return hasCompletedSetup ? getDashboardPath(locale) : getCompanySetupPath(locale);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        return passwordsMatch ? user : null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
};

export function auth() {
  return getServerSession(authOptions);
}

export async function requireAuth(
  locale: string = 'en',
  options: {
    enforceCompanySetup?: boolean;
  } = {}
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (options.enforceCompanySetup !== false) {
    const hasCompletedSetup = await hasCompletedCompanySetup(session.user.id);

    if (!hasCompletedSetup) {
      redirect(getCompanySetupPath(locale));
    }
  }

  return session;
}
