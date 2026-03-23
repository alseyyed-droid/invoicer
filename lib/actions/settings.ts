'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureCompanyInfo, ensureUserPreferences } from '@/lib/user-data';

const profileSchema = z.object({
  locale: z.string().min(2),
  name: z.string().trim().min(2, 'Name is required.'),
  email: z.string().trim().email('Enter a valid email address.'),
  mobileNumber: z.string().trim().max(50, 'Mobile number is too long.').optional()
});

const passwordSchema = z
  .object({
    locale: z.string().min(2),
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Please confirm the new password.')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation must match.',
    path: ['confirmPassword']
  });

const companySchema = z.object({
  locale: z.string().min(2),
  companyName: z.string().trim().min(1, 'Company name is required.').max(191),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  companyEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid company email.'),
  address: z.string().trim().max(5000).optional(),
  postalCode: z.string().trim().max(50).optional(),
  companyLogo: z.string().trim().max(250000).optional(),
  taxPerItem: z.boolean()
});

const preferencesSchema = z.object({
  locale: z.string().min(2),
  language: z.enum(['en', 'ar']),
  currency: z.string().trim().min(1).max(10),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  timeZone: z.string().trim().min(1).max(100),
  fiscalYear: z.enum(['January - December', 'April - March', 'July - June']),
  timeFormat: z.enum(['24h', '12h'])
});

const customizationSchema = z.object({
  locale: z.string().min(2),
  invoicePrefix: z.string().trim().min(1, 'Invoice prefix is required.').max(20),
  invoiceSeparator: z.string().max(10),
  invoiceNumberLength: z
    .number()
    .int('Invoice number length must be a whole number.')
    .min(1, 'Invoice number length must be at least 1.')
    .max(12, 'Invoice number length must be 12 or less.')
});

const taxTypeSchema = z.object({
  locale: z.string().min(2),
  title: z.string().trim().min(1, 'Title is required.').max(191),
  percentage: z.number().min(0, 'Percentage must be positive.').max(100, 'Percentage cannot exceed 100.'),
  description: z.string().trim().max(5000).optional()
});

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function revalidateSettingsPaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/settings`);
  revalidatePath(`/${locale}/invoices/new`);
}

export async function saveProfileSettingsAction(input: z.infer<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid profile details.'
    };
  }

  const { locale, name, email, mobileNumber } = parsed.data;
  const session = await requireAuth(locale);
  const userId = session.user.id;

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId }
    },
    select: { id: true }
  });

  if (existingUser) {
    return {
      success: false as const,
      error: 'Another account already uses this email address.'
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      mobileNumber: normalizeOptional(mobileNumber)
    }
  });

  revalidateSettingsPaths(locale);

  return {
    success: true as const,
    message: 'Profile updated successfully.'
  };
}

export async function changePasswordAction(input: z.infer<typeof passwordSchema>) {
  const parsed = passwordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid password details.'
    };
  }

  const { locale, currentPassword, newPassword } = parsed.data;
  const session = await requireAuth(locale);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  });

  if (!user?.password) {
    return {
      success: false as const,
      error: 'Password login is not available for this account.'
    };
  }

  const matches = await bcrypt.compare(currentPassword, user.password);

  if (!matches) {
    return {
      success: false as const,
      error: 'Current password is incorrect.'
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: passwordHash }
  });

  revalidateSettingsPaths(locale);

  return {
    success: true as const,
    message: 'Password updated successfully.'
  };
}

export async function saveCompanySettingsAction(input: z.infer<typeof companySchema>) {
  const parsed = companySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid company details.'
    };
  }

  const { locale, ...data } = parsed.data;
  const session = await requireAuth(locale, { enforceCompanySetup: false });
  const companyInfo = await ensureCompanyInfo(session.user.id);

  await prisma.companyInfo.update({
    where: { id: companyInfo.id },
    data: {
      companyName: normalizeOptional(data.companyName),
      country: normalizeOptional(data.country),
      city: normalizeOptional(data.city),
      companyEmail: normalizeOptional(data.companyEmail),
      address: normalizeOptional(data.address),
      postalCode: normalizeOptional(data.postalCode),
      companyLogo: normalizeOptional(data.companyLogo),
      taxPerItem: data.taxPerItem
    }
  });

  revalidateSettingsPaths(locale);

  return {
    success: true as const,
    message: 'Company settings updated successfully.'
  };
}

export async function savePreferencesSettingsAction(input: z.infer<typeof preferencesSchema>) {
  const parsed = preferencesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid preference details.'
    };
  }

  const { locale, language, currency, dateFormat, timeZone, fiscalYear, timeFormat } = parsed.data;
  const session = await requireAuth(locale);
  const preferences = await ensureUserPreferences(session.user.id, locale);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        locale: language
      }
    }),
    prisma.userPreferences.update({
      where: { id: preferences.id },
      data: {
        language,
        currency,
        dateFormat,
        timeZone,
        fiscalYear,
        timeFormat
      }
    })
  ]);

  revalidateSettingsPaths(locale);
  if (language !== locale) {
    revalidateSettingsPaths(language);
  }

  return {
    success: true as const,
    message: 'Preferences updated successfully.',
    nextLocale: language
  };
}

export async function saveCustomizationSettingsAction(input: z.infer<typeof customizationSchema>) {
  const parsed = customizationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid customization details.'
    };
  }

  const { locale, invoicePrefix, invoiceSeparator, invoiceNumberLength } = parsed.data;
  const session = await requireAuth(locale);
  const preferences = await ensureUserPreferences(session.user.id, locale);

  await prisma.userPreferences.update({
    where: { id: preferences.id },
    data: {
      invoicePrefix,
      invoiceSeparator,
      invoiceNumberLength
    }
  });

  revalidateSettingsPaths(locale);

  return {
    success: true as const,
    message: 'Customization updated successfully.'
  };
}

export async function createTaxTypeAction(input: z.infer<typeof taxTypeSchema>) {
  const parsed = taxTypeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid tax type details.'
    };
  }

  const { locale, title, percentage, description } = parsed.data;
  const session = await requireAuth(locale);

  const taxType = await prisma.taxType.create({
    data: {
      title,
      percentage,
      description: normalizeOptional(description),
      userId: session.user.id
    }
  });

  revalidateSettingsPaths(locale);
  revalidatePath(`/${locale}/tax-types`);

  return {
    success: true as const,
    message: 'Tax type created successfully.',
    taxType: {
      ...taxType,
      description: taxType.description ?? ''
    }
  };
}

export async function updateTaxTypeAction(
  input: z.infer<typeof taxTypeSchema> & {
    id: string;
  }
) {
  const parsed = taxTypeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid tax type details.'
    };
  }

  const { locale, title, percentage, description } = parsed.data;
  const session = await requireAuth(locale);

  const existingTaxType = await prisma.taxType.findFirst({
    where: {
      id: input.id,
      userId: session.user.id
    }
  });

  if (!existingTaxType) {
    return {
      success: false as const,
      error: 'Tax type not found.'
    };
  }

  const taxType = await prisma.taxType.update({
    where: { id: input.id },
    data: {
      title,
      percentage,
      description: normalizeOptional(description)
    }
  });

  revalidateSettingsPaths(locale);
  revalidatePath(`/${locale}/tax-types`);

  return {
    success: true as const,
    message: 'Tax type updated successfully.',
    taxType: {
      ...taxType,
      description: taxType.description ?? ''
    }
  };
}

export async function deleteTaxTypeAction(input: { id: string; locale: string }) {
  const session = await requireAuth(input.locale);

  const existingTaxType = await prisma.taxType.findFirst({
    where: {
      id: input.id,
      userId: session.user.id
    },
    select: { id: true }
  });

  if (!existingTaxType) {
    return {
      success: false as const,
      error: 'Tax type not found.'
    };
  }

  await prisma.taxType.delete({
    where: { id: input.id }
  });

  revalidateSettingsPaths(input.locale);
  revalidatePath(`/${input.locale}/tax-types`);

  return {
    success: true as const,
    message: 'Tax type deleted successfully.'
  };
}
