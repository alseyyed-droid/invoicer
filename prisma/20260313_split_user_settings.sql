ALTER TABLE `User`
ADD COLUMN `mobileNumber` VARCHAR(50) NULL;

CREATE TABLE `CompanyInfo` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `companyName` VARCHAR(191) NULL,
  `country` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `companyEmail` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `postalCode` VARCHAR(50) NULL,
  `companyLogo` LONGTEXT NULL,
  `taxPerItem` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CompanyInfo_userId_key`(`userId`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `UserPreferences` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `dateFormat` VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
  `timeZone` VARCHAR(100) NOT NULL DEFAULT 'Asia/Amman',
  `fiscalYear` VARCHAR(50) NOT NULL DEFAULT 'January - December',
  `timeFormat` VARCHAR(10) NOT NULL DEFAULT '24h',
  `invoicePrefix` VARCHAR(20) NOT NULL DEFAULT 'INV',
  `invoiceSeparator` VARCHAR(10) NOT NULL DEFAULT '-',
  `invoiceNumberLength` INTEGER NOT NULL DEFAULT 6,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `UserPreferences_userId_key`(`userId`),
  PRIMARY KEY (`id`)
);

ALTER TABLE `CompanyInfo`
ADD CONSTRAINT `CompanyInfo_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserPreferences`
ADD CONSTRAINT `UserPreferences_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `User` u
INNER JOIN `UserSettings` us ON us.`userId` = u.`id`
SET u.`mobileNumber` = us.`mobileNumber`
WHERE u.`mobileNumber` IS NULL;

INSERT INTO `CompanyInfo` (
  `id`,
  `userId`,
  `companyName`,
  `country`,
  `city`,
  `companyEmail`,
  `address`,
  `postalCode`,
  `companyLogo`,
  `taxPerItem`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  us.`userId`,
  us.`companyName`,
  us.`country`,
  us.`city`,
  us.`companyEmail`,
  us.`address`,
  us.`postalCode`,
  us.`companyLogo`,
  us.`taxPerItem`,
  us.`createdAt`,
  us.`updatedAt`
FROM `UserSettings` us
LEFT JOIN `CompanyInfo` ci ON ci.`userId` = us.`userId`
WHERE ci.`userId` IS NULL;

INSERT INTO `UserPreferences` (
  `id`,
  `userId`,
  `language`,
  `currency`,
  `dateFormat`,
  `timeZone`,
  `fiscalYear`,
  `timeFormat`,
  `invoicePrefix`,
  `invoiceSeparator`,
  `invoiceNumberLength`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  us.`userId`,
  us.`language`,
  us.`currency`,
  us.`dateFormat`,
  us.`timeZone`,
  us.`fiscalYear`,
  us.`timeFormat`,
  us.`invoicePrefix`,
  us.`invoiceSeparator`,
  us.`invoiceNumberLength`,
  us.`createdAt`,
  us.`updatedAt`
FROM `UserSettings` us
LEFT JOIN `UserPreferences` up ON up.`userId` = us.`userId`
WHERE up.`userId` IS NULL;
