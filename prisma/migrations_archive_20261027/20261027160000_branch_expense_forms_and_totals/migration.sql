-- DropForeignKey
ALTER TABLE `UserPermission` DROP FOREIGN KEY `UserPermission_grantedById_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntry` DROP FOREIGN KEY `AccountEntry_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntry` DROP FOREIGN KEY `AccountEntry_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntry` DROP FOREIGN KEY `AccountEntry_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntryItem` DROP FOREIGN KEY `AccountEntryItem_accountEntryId_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntryItem` DROP FOREIGN KEY `AccountEntryItem_medicineId_fkey`;

-- DropForeignKey
ALTER TABLE `AccountEntryItem` DROP FOREIGN KEY `AccountEntryItem_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `PatientVisit` DROP FOREIGN KEY `PatientVisit_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `PatientVisit` DROP FOREIGN KEY `PatientVisit_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `FeedbackEntry` DROP FOREIGN KEY `FeedbackEntry_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `FeedbackEntry` DROP FOREIGN KEY `FeedbackEntry_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `CourseSale` DROP FOREIGN KEY `CourseSale_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `CourseSale` DROP FOREIGN KEY `CourseSale_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `CardSale` DROP FOREIGN KEY `CardSale_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `CardSale` DROP FOREIGN KEY `CardSale_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `CoreInvestment` DROP FOREIGN KEY `CoreInvestment_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `CoreInvestment` DROP FOREIGN KEY `CoreInvestment_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `MedicinePurchase` DROP FOREIGN KEY `MedicinePurchase_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `MedicinePurchase` DROP FOREIGN KEY `MedicinePurchase_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `MarketingExpense` DROP FOREIGN KEY `MarketingExpense_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `MarketingExpense` DROP FOREIGN KEY `MarketingExpense_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `CsrFund` DROP FOREIGN KEY `CsrFund_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `CsrFund` DROP FOREIGN KEY `CsrFund_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `LoanRepayment` DROP FOREIGN KEY `LoanRepayment_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `LoanRepayment` DROP FOREIGN KEY `LoanRepayment_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `AdvanceTax` DROP FOREIGN KEY `AdvanceTax_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `AdvanceTax` DROP FOREIGN KEY `AdvanceTax_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `OtherExpense` DROP FOREIGN KEY `OtherExpense_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `OtherExpense` DROP FOREIGN KEY `OtherExpense_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `DirectorSalary` DROP FOREIGN KEY `DirectorSalary_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `DirectorSalary` DROP FOREIGN KEY `DirectorSalary_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `MiscellaneousExpense` DROP FOREIGN KEY `MiscellaneousExpense_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `MiscellaneousExpense` DROP FOREIGN KEY `MiscellaneousExpense_updatedById_fkey`;

-- DropForeignKey
ALTER TABLE `BranchExpense` DROP FOREIGN KEY `BranchExpense_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `BranchExpense` DROP FOREIGN KEY `BranchExpense_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `BranchExpense` DROP FOREIGN KEY `BranchExpense_updatedById_fkey`;

-- AlterTable
ALTER TABLE `CoreInvestment` ADD COLUMN `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `MedicinePurchase` ADD COLUMN `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `MarketingExpense` ADD COLUMN `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `OtherExpense` ADD COLUMN `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `Medicine`;

-- DropTable
DROP TABLE `AccountEntry`;

-- DropTable
DROP TABLE `AccountEntryItem`;

-- DropTable
DROP TABLE `MiscellaneousExpense`;

-- DropTable
DROP TABLE `BranchExpense`;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('MEDICINE', 'OTC') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Item_isActive_idx`(`isActive`),
    INDEX `Item_name_idx`(`name`),
    UNIQUE INDEX `Item_name_type_key`(`name`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sale` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `entryType` ENUM('OTC', 'DOCTOR_PRESCRIBED_MEDICINE') NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `gstPercentage` DECIMAL(5, 2) NOT NULL,
    `gstAmount` DECIMAL(12, 2) NOT NULL,
    `sgstPercentage` DECIMAL(5, 2) NOT NULL,
    `sgstAmount` DECIMAL(12, 2) NOT NULL,
    `cgstPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `cgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sale_date_idx`(`date`),
    INDEX `Sale_branchId_date_idx`(`branchId`, `date`),
    INDEX `Sale_entryType_date_idx`(`entryType`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaleItem` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `itemNameSnapshot` VARCHAR(191) NOT NULL,
    `unitSold` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `totalPrice` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SaleItem_saleId_idx`(`saleId`),
    INDEX `SaleItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceSale` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `serviceType` ENUM('CONSULTATION', 'THERAPY', 'OTHER') NOT NULL,
    `serviceNameSnapshot` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceSale_date_idx`(`date`),
    INDEX `ServiceSale_branchId_date_idx`(`branchId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyMiscellaneousExpense` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `voucherId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paymentMethod` ENUM('CASH', 'ONLINE') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyMiscellaneousExpense_date_idx`(`date`),
    INDEX `CompanyMiscellaneousExpense_voucherId_idx`(`voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchSalary` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `personName` VARCHAR(160) NOT NULL,
    `role` VARCHAR(160) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `salary` DECIMAL(14, 2) NOT NULL,
    `dateCredited` DATE NOT NULL,
    `totalAmount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchSalary_branchId_year_month_idx`(`branchId`, `year`, `month`),
    INDEX `BranchSalary_dateCredited_idx`(`dateCredited`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchRent` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `rentAmount` DECIMAL(14, 2) NOT NULL,
    `tdsPercentage` DECIMAL(5, 2) NOT NULL,
    `tdsDeduction` DECIMAL(14, 2) NOT NULL,
    `netAmount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchRent_branchId_year_month_idx`(`branchId`, `year`, `month`),
    INDEX `BranchRent_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchWaterBill` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `billId` VARCHAR(80) NOT NULL,
    `paidDate` DATE NOT NULL,
    `assignedDate` DATE NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchWaterBill_branchId_year_month_idx`(`branchId`, `year`, `month`),
    INDEX `BranchWaterBill_paidDate_idx`(`paidDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchPowerBill` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `billId` VARCHAR(80) NOT NULL,
    `assignedDate` DATE NOT NULL,
    `paidDate` DATE NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchPowerBill_branchId_year_month_idx`(`branchId`, `year`, `month`),
    INDEX `BranchPowerBill_paidDate_idx`(`paidDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchFoodGroceries` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `date` DATE NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `totalAmount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchFoodGroceries_branchId_year_month_idx`(`branchId`, `year`, `month`),
    INDEX `BranchFoodGroceries_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchGovernmentFee` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `year` INTEGER NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchGovernmentFee_branchId_year_idx`(`branchId`, `year`),
    INDEX `BranchGovernmentFee_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchInvestmentPurchase` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `year` INTEGER NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchInvestmentPurchase_branchId_year_idx`(`branchId`, `year`),
    INDEX `BranchInvestmentPurchase_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchMiscellaneousExpense` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `voucherId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paymentMethod` ENUM('CASH', 'ONLINE') NOT NULL,
    `year` INTEGER NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchMiscellaneousExpense_branchId_year_idx`(`branchId`, `year`),
    INDEX `BranchMiscellaneousExpense_date_idx`(`date`),
    INDEX `BranchMiscellaneousExpense_voucherId_idx`(`voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaleItem` ADD CONSTRAINT `SaleItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSale` ADD CONSTRAINT `ServiceSale_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSale` ADD CONSTRAINT `ServiceSale_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchSalary` ADD CONSTRAINT `BranchSalary_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchRent` ADD CONSTRAINT `BranchRent_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchWaterBill` ADD CONSTRAINT `BranchWaterBill_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchPowerBill` ADD CONSTRAINT `BranchPowerBill_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchFoodGroceries` ADD CONSTRAINT `BranchFoodGroceries_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchGovernmentFee` ADD CONSTRAINT `BranchGovernmentFee_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchInvestmentPurchase` ADD CONSTRAINT `BranchInvestmentPurchase_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchMiscellaneousExpense` ADD CONSTRAINT `BranchMiscellaneousExpense_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

