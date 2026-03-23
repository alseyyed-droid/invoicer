'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getDefaultCompanyInfo, getDefaultUserPreferences } from '@/lib/user-data';

const registerSchema = z
  .object({
    locale: z.string().min(2),
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Please confirm your password.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.')
});

export async function registerUserAction(input: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    return {
      success: false as const,
      field: (firstIssue?.path[0] as string | undefined) ?? 'form',
      error: firstIssue?.message ?? 'Invalid registration details.'
    };
  }

  const { name, email, password, locale } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return {
      success: false as const,
      field: 'email',
      error: 'An account with this email already exists.'
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      locale,
      companyInfo: {
        create: getDefaultCompanyInfo()
      },
      preferences: {
        create: getDefaultUserPreferences(locale)
      }
    }
  });

  return {
    success: true as const
  };
}

export async function requestPasswordResetAction(input: z.infer<typeof forgotPasswordSchema>) {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Enter a valid email address.'
    };
  }

  return {
    success: true as const,
    message: 'If an account exists for this email, a reset link has been requested.'
  };
}
