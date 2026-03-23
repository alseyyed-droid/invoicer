import { prisma } from '@/lib/prisma';

export function getDefaultUserPreferences(locale: string = 'en') {
  return {
    language: locale,
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Asia/Amman',
    fiscalYear: 'January - December',
    timeFormat: '24h',
    invoicePrefix: 'INV',
    invoiceSeparator: '-',
    invoiceNumberLength: 6
  };
}

export function getDefaultCompanyInfo() {
  return {
    taxPerItem: true
  };
}

export async function ensureCompanyInfo(userId: string) {
  return prisma.companyInfo.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...getDefaultCompanyInfo()
    }
  });
}

export async function ensureUserPreferences(userId: string, locale: string = 'en') {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...getDefaultUserPreferences(locale)
    }
  });
}

export async function ensureUserData(userId: string, locale: string = 'en') {
  const [companyInfo, preferences] = await Promise.all([
    ensureCompanyInfo(userId),
    ensureUserPreferences(userId, locale)
  ]);

  return {
    companyInfo,
    preferences
  };
}

export function formatInvoiceNumber(
  prefix: string,
  separator: string,
  length: number,
  sequence: number
) {
  const safePrefix = prefix.trim() || 'INV';
  const safeSeparator = separator ?? '-';
  const safeLength = Math.min(Math.max(length || 6, 1), 12);
  const paddedNumber = String(sequence).padStart(safeLength, '0');

  return safeSeparator ? `${safePrefix}${safeSeparator}${paddedNumber}` : `${safePrefix}${paddedNumber}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getNextInvoiceNumber(userId: string, locale: string = 'en') {
  const [{ preferences }, existingInvoices] = await Promise.all([
    ensureUserData(userId, locale),
    prisma.invoice.findMany({
      where: { userId },
      select: {
        number: true
      }
    })
  ]);

  const existingNumbers = new Set(existingInvoices.map((invoice) => invoice.number));
  const safePrefix = preferences.invoicePrefix.trim() || 'INV';
  const safeSeparator = preferences.invoiceSeparator ?? '-';
  const sequencePattern = new RegExp(
    `^${escapeRegExp(safePrefix)}${escapeRegExp(safeSeparator)}(\\d+)$`
  );

  let sequence = existingInvoices.length + 1;

  for (const invoice of existingInvoices) {
    const match = invoice.number.match(sequencePattern);

    if (!match) {
      continue;
    }

    const parsedSequence = Number.parseInt(match[1], 10);

    if (Number.isFinite(parsedSequence)) {
      sequence = Math.max(sequence, parsedSequence + 1);
    }
  }

  let nextInvoiceNumber = formatInvoiceNumber(
    preferences.invoicePrefix,
    preferences.invoiceSeparator,
    preferences.invoiceNumberLength,
    sequence
  );

  while (existingNumbers.has(nextInvoiceNumber)) {
    sequence += 1;
    nextInvoiceNumber = formatInvoiceNumber(
      preferences.invoicePrefix,
      preferences.invoiceSeparator,
      preferences.invoiceNumberLength,
      sequence
    );
  }

  return nextInvoiceNumber;
}
