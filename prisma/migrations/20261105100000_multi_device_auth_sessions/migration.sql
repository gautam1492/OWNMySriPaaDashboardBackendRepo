CREATE TABLE `AuthSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(512) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuthSession_userId_revokedAt_idx`(`userId`, `revokedAt`),
    INDEX `AuthSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RefreshToken` ADD COLUMN `sessionId` VARCHAR(191) NULL;

-- Preserve existing active logins by assigning every currently usable refresh token
-- its own legacy device session before the new API begins enforcing session IDs.
INSERT INTO `AuthSession` (
    `id`, `userId`, `userAgent`, `ipAddress`, `expiresAt`, `lastActiveAt`, `createdAt`
)
SELECT
    CONCAT('legacy_', `id`), `userId`, `userAgent`, `ipAddress`, `expiresAt`, `createdAt`, `createdAt`
FROM `RefreshToken`
WHERE `revokedAt` IS NULL;

UPDATE `RefreshToken`
SET `sessionId` = CONCAT('legacy_', `id`)
WHERE `revokedAt` IS NULL;

CREATE INDEX `RefreshToken_sessionId_idx` ON `RefreshToken`(`sessionId`);

ALTER TABLE `AuthSession`
ADD CONSTRAINT `AuthSession_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RefreshToken`
ADD CONSTRAINT `RefreshToken_sessionId_fkey`
FOREIGN KEY (`sessionId`) REFERENCES `AuthSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
