import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'invoicer',
  connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

const email = process.env.SEED_USER_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_USER_PASSWORD ?? 'password123';
const locale = process.env.SEED_USER_LOCALE ?? 'en';

function getDefaultUserPreferences(nextLocale = 'en') {
  return {
    language: nextLocale,
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

function getDefaultCompanyInfo() {
  return {
    taxPerItem: true
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      name: 'Admin User',
      locale
    },
    create: {
      email,
      password: passwordHash,
      name: 'Admin User',
      locale,
      companyInfo: {
        create: getDefaultCompanyInfo()
      },
      preferences: {
        create: getDefaultUserPreferences(locale)
      }
    }
  });

  await prisma.companyInfo.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...getDefaultCompanyInfo()
    }
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...getDefaultUserPreferences(locale)
    }
  });

  console.log(`Seeded user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
