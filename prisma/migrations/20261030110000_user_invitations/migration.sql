ALTER TABLE `User`
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `UserInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `invitedName` VARCHAR(160) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `roleId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `acceptedUserId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastSentAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `expiryEmailSentAt` DATETIME(3) NULL,
    `expiryEmailClaimedAt` DATETIME(3) NULL,
    `expiryEmailAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastEmailError` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `UserInvitation_tokenHash_key`(`tokenHash`),
    UNIQUE INDEX `UserInvitation_acceptedUserId_key`(`acceptedUserId`),
    INDEX `UserInvitation_email_status_idx`(`email`, `status`),
    INDEX `UserInvitation_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `UserInvitation_invitedById_createdAt_idx`(`invitedById`, `createdAt`),
    INDEX `UserInvitation_status_expiryEmailSentAt_expiryEmailClaimedAt_idx`(`status`, `expiryEmailSentAt`, `expiryEmailClaimedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InvitationBranch` (
    `invitationId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `InvitationBranch_branchId_idx`(`branchId`),
    PRIMARY KEY (`invitationId`, `branchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserInvitation`
    ADD CONSTRAINT `UserInvitation_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `UserInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `UserInvitation_acceptedUserId_fkey` FOREIGN KEY (`acceptedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `InvitationBranch`
    ADD CONSTRAINT `InvitationBranch_invitationId_fkey` FOREIGN KEY (`invitationId`) REFERENCES `UserInvitation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `InvitationBranch_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
