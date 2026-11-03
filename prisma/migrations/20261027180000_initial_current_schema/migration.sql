-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'ACCOUNTS_FINANCE', 'DATA_ENTRY', 'VIEWER_AUDITOR') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Branch_name_key`(`name`),
    UNIQUE INDEX `Branch_code_key`(`code`),
    INDEX `Branch_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `mobileNumber` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBranch` (
    `userId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserBranch_branchId_idx`(`branchId`),
    PRIMARY KEY (`userId`, `branchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermission` (
    `userId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `grantedById` VARCHAR(191) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserPermission_permissionId_idx`(`permissionId`),
    INDEX `UserPermission_grantedById_idx`(`grantedById`),
    PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `replacedByTokenId` VARCHAR(191) NULL,
    `userAgent` VARCHAR(512) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RefreshToken_tokenHash_key`(`tokenHash`),
    INDEX `RefreshToken_userId_idx`(`userId`),
    INDEX `RefreshToken_expiresAt_idx`(`expiresAt`),
    INDEX `RefreshToken_revokedAt_idx`(`revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('CONSULTATION', 'THERAPY', 'OTHER') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Service_name_key`(`name`),
    INDEX `Service_type_idx`(`type`),
    INDEX `Service_isActive_idx`(`isActive`),
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
CREATE TABLE `PatientVisit` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `newPatients` INTEGER NOT NULL,
    `followupPatients` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PatientVisit_date_idx`(`date`),
    INDEX `PatientVisit_branchId_date_idx`(`branchId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackEntry` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `doctor` VARCHAR(160) NOT NULL,
    `service` VARCHAR(160) NOT NULL,
    `patientType` ENUM('OPD', 'IPD') NOT NULL,
    `filledBy` ENUM('PATIENT_SELF', 'STAFF') NOT NULL,
    `frontdeskRating` INTEGER NOT NULL,
    `posttreatmentRating` INTEGER NOT NULL,
    `comments` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FeedbackEntry_date_idx`(`date`),
    INDEX `FeedbackEntry_branchId_date_idx`(`branchId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
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
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
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
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
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
    `gst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(120) NOT NULL,
    `resourceType` VARCHAR(80) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_resourceType_resourceId_idx`(`resourceType`, `resourceId`(128)),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBranch` ADD CONSTRAINT `UserBranch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBranch` ADD CONSTRAINT `UserBranch_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `PatientVisit` ADD CONSTRAINT `PatientVisit_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackEntry` ADD CONSTRAINT `FeedbackEntry_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_courseDoctorId_fkey` FOREIGN KEY (`courseDoctorId`) REFERENCES `CourseDoctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseSale` ADD CONSTRAINT `CourseSale_courseDoctorId_fkey` FOREIGN KEY (`courseDoctorId`) REFERENCES `CourseDoctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSale` ADD CONSTRAINT `CardSale_cardTypeId_fkey` FOREIGN KEY (`cardTypeId`) REFERENCES `CardType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoreInvestment` ADD CONSTRAINT `CoreInvestment_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanRepayment` ADD CONSTRAINT `LoanRepayment_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectorSalary` ADD CONSTRAINT `DirectorSalary_directorId_fkey` FOREIGN KEY (`directorId`) REFERENCES `Director`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

