CREATE TABLE `DailyDataReminderDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessDate` VARCHAR(10) NOT NULL,
    `claimedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `DailyDataReminderDelivery_userId_businessDate_key` (`userId`, `businessDate`),
    INDEX `DailyDataReminderDelivery_businessDate_sentAt_idx` (`businessDate`, `sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DailyDataReminderDelivery`
    ADD CONSTRAINT `DailyDataReminderDelivery_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
