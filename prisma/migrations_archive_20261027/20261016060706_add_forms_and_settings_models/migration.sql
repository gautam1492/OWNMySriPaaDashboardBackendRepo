/*
  Warnings:

  - The values [BRANCH_MANAGER,STAFF] on the enum `Role_name` will be removed. If these variants are still used in the database, this will fail.

*/

-- CreateTable
CREATE TABLE `CourseDoctor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CourseDoctor_name_key`(`name`),
    INDEX `CourseDoctor_isActive_idx`(`isActive`),
    INDEX `CourseDoctor_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `courseDoctorId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Course_name_key`(`name`),
    INDEX `Course_isActive_idx`(`isActive`),
    INDEX `Course_name_idx`(`name`),
    INDEX `Course_courseDoctorId_idx`(`courseDoctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `defaultPrice` DECIMAL(12, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CardType_name_key`(`name`),
    INDEX `CardType_isActive_idx`(`isActive`),
    INDEX `CardType_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `originalAmount` DECIMAL(14, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Loan_name_key`(`name`),
    INDEX `Loan_isActive_idx`(`isActive`),
    INDEX `Loan_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Director` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Director_name_key`(`name`),
    INDEX `Director_isActive_idx`(`isActive`),
    INDEX `Director_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseSale` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseDoctorId` VARCHAR(191) NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `numberOfCourses` INTEGER NOT NULL,
    `pricePerCourse` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `customerId` VARCHAR(160) NOT NULL,
    `membershipType` ENUM('GREEN_CARD', 'GOLDEN_CARD', 'OTHER') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseSale_purchaseDate_idx`(`purchaseDate`),
    INDEX `CourseSale_courseId_idx`(`courseId`),
    INDEX `CourseSale_courseDoctorId_idx`(`courseDoctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardSale` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `cardTypeId` VARCHAR(191) NOT NULL,
    `cardPrice` DECIMAL(12, 2) NOT NULL,
    `numberOfCards` INTEGER NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CardSale_date_idx`(`date`),
    INDEX `CardSale_cardTypeId_idx`(`cardTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoreInvestment` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `billingDate` DATE NOT NULL,
    `paymentDate` DATE NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `belongsTo` ENUM('COMPANY', 'BRANCH') NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CoreInvestment_paymentDate_idx`(`paymentDate`),
    INDEX `CoreInvestment_belongsTo_idx`(`belongsTo`),
    INDEX `CoreInvestment_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicinePurchase` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `billingDate` DATE NOT NULL,
    `paymentDate` DATE NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MedicinePurchase_paymentDate_idx`(`paymentDate`),
    INDEX `MedicinePurchase_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingExpense` (
    `id` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(160) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `billingDate` DATE NOT NULL,
    `paymentDate` DATE NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `expenseMonth` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `expenseYear` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MarketingExpense_paymentDate_idx`(`paymentDate`),
    INDEX `MarketingExpense_expenseYear_expenseMonth_idx`(`expenseYear`, `expenseMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CsrFund` (
    `id` VARCHAR(191) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `lastMonthTotalIncome` DECIMAL(14, 2) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CsrFund_year_idx`(`year`),
    UNIQUE INDEX `CsrFund_year_month_key`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanRepayment` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `repaymentAmount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LoanRepayment_loanId_idx`(`loanId`),
    INDEX `LoanRepayment_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvanceTax` (
    `id` VARCHAR(191) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `amountPaid` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdvanceTax_year_month_idx`(`year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtherExpense` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `invoiceId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `billingDate` DATE NOT NULL,
    `paymentDate` DATE NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `year` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OtherExpense_paymentDate_idx`(`paymentDate`),
    INDEX `OtherExpense_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DirectorSalary` (
    `id` VARCHAR(191) NOT NULL,
    `month` ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER') NOT NULL,
    `year` INTEGER NOT NULL,
    `directorId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DirectorSalary_year_month_idx`(`year`, `month`),
    INDEX `DirectorSalary_directorId_idx`(`directorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MiscellaneousExpense` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(160) NOT NULL,
    `voucherId` VARCHAR(80) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `gst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paymentMethod` ENUM('CASH', 'ONLINE') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MiscellaneousExpense_date_idx`(`date`),
    INDEX `MiscellaneousExpense_voucherId_idx`(`voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BranchExpense` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `salary` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `rent` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `waterAndPower` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `foodAndGroceries` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `governmentFees` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `investmentPurchase` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `miscellaneous` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(14, 2) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BranchExpense_date_idx`(`date`),
    INDEX `BranchExpense_branchId_date_idx`(`branchId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey

ALTER TABLE `User` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntry` ADD CONSTRAINT `AccountEntry_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntry` ADD CONSTRAINT `AccountEntry_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntry` ADD CONSTRAINT `AccountEntry_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntryItem` ADD CONSTRAINT `AccountEntryItem_accountEntryId_fkey` FOREIGN KEY (`accountEntryId`) REFERENCES `AccountEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntryItem` ADD CONSTRAINT `AccountEntryItem_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `Medicine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountEntryItem` ADD CONSTRAINT `AccountEntryItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientVisit` ADD CONSTRAINT `PatientVisit_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientVisit` ADD CONSTRAINT `PatientVisit_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientVisit` ADD CONSTRAINT `PatientVisit_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackEntry` ADD CONSTRAINT `FeedbackEntry_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackEntry` ADD CONSTRAINT `FeedbackEntry_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackEntry` ADD CONSTRAINT `FeedbackEntry_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_courseDoctorId_fkey` FOREIGN KEY (`courseDoctorId`) REFERENCES `CourseDoctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_courseDoctorId_fkey` FOREIGN KEY (`courseDoctorId`) REFERENCES `CourseDoctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSale` ADD CONSTRAINT `CardSale_cardTypeId_fkey` FOREIGN KEY (`cardTypeId`) REFERENCES `CardType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSale` ADD CONSTRAINT `CardSale_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSale` ADD CONSTRAINT `CardSale_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoreInvestment` ADD CONSTRAINT `CoreInvestment_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoreInvestment` ADD CONSTRAINT `CoreInvestment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoreInvestment` ADD CONSTRAINT `CoreInvestment_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicinePurchase` ADD CONSTRAINT `MedicinePurchase_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicinePurchase` ADD CONSTRAINT `MedicinePurchase_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingExpense` ADD CONSTRAINT `MarketingExpense_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingExpense` ADD CONSTRAINT `MarketingExpense_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CsrFund` ADD CONSTRAINT `CsrFund_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CsrFund` ADD CONSTRAINT `CsrFund_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRepayment` ADD CONSTRAINT `LoanRepayment_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRepayment` ADD CONSTRAINT `LoanRepayment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRepayment` ADD CONSTRAINT `LoanRepayment_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceTax` ADD CONSTRAINT `AdvanceTax_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceTax` ADD CONSTRAINT `AdvanceTax_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OtherExpense` ADD CONSTRAINT `OtherExpense_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OtherExpense` ADD CONSTRAINT `OtherExpense_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectorSalary` ADD CONSTRAINT `DirectorSalary_directorId_fkey` FOREIGN KEY (`directorId`) REFERENCES `Director`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectorSalary` ADD CONSTRAINT `DirectorSalary_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectorSalary` ADD CONSTRAINT `DirectorSalary_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MiscellaneousExpense` ADD CONSTRAINT `MiscellaneousExpense_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MiscellaneousExpense` ADD CONSTRAINT `MiscellaneousExpense_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchExpense` ADD CONSTRAINT `BranchExpense_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchExpense` ADD CONSTRAINT `BranchExpense_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BranchExpense` ADD CONSTRAINT `BranchExpense_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
