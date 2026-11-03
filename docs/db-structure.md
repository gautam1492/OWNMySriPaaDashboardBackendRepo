# Database Structure

This reference is generated from the current `prisma/schema.prisma`. It documents the active development schema.
Regenerate Prisma Client and migrations from the project scripts after schema changes.

## Sales and catalog model

- Item is the shared catalog for medicine and OTC products. Item.type distinguishes MEDICINE and OTC; it has no MRP field.
- Sale stores date, branch, entry type, subtotal, tax percentages/amounts, total, and audit user ids.
- SaleItem stores one sale line: saleId, itemId, item-name snapshot, units sold, unit price, and total price.
- ServiceSale stores one service transaction separately, with date, branch, service reference/type/name snapshot, amount, and audit user ids.
- There are no AccountEntry or AccountEntryItem models.

## Enums

### RoleName

SUPER_ADMIN, ADMIN, DIRECTOR, ACCOUNTS_FINANCE, DATA_ENTRY, VIEWER_AUDITOR

### EntryType

OTC, DOCTOR_PRESCRIBED_MEDICINE

### ItemType

MEDICINE, OTC

### CardMembershipType

GREEN_CARD, GOLDEN_CARD, OTHER

### ExpenseOwnerType

COMPANY, BRANCH

### PaymentMethod

CASH, ONLINE

### Month

JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER

### ServiceType

CONSULTATION, THERAPY, OTHER

### PatientType

OPD, IPD

### FilledBy

PATIENT_SELF, STAFF

## Role permissions and account-management rules

The `Role` table stores each user's role assignment; the full default permission sets are defined in application code (`src/constants/permissions.ts`), rather than stored as columns on `Role`. `UserPermission` stores additional permission grants for an individual user. `SUPER_ADMIN` implicitly has every permission. `ADMIN` and `DIRECTOR` have broad role defaults, but Director access to branch-specific data is restricted to assigned active branches. Only `SUPER_ADMIN` may create or manage `ADMIN` accounts.

User-management hierarchy is enforced in application code (`src/constants/roles.ts` and `src/modules/users/user.service.ts`): only `SUPER_ADMIN` can create an `ADMIN` account or modify any field of an existing `ADMIN` account. This applies to profile edits, role, status, branch assignments, deletion, and extra permission grants/revocations. These restrictions are business rules, not database constraints.

### Branch assignment behavior

`UserBranch` persists user-to-branch assignments. `SUPER_ADMIN` and `ADMIN` can access all active branches without assignments. `DIRECTOR`, `ACCOUNTS_FINANCE`, `DATA_ENTRY`, and `VIEWER_AUDITOR` require assignments and are limited to those branches for branch-specific records. A Director may assign users at or below Director only to branches assigned to that Director. Company-level records are not branch-scoped and remain permission-controlled.

## Models

### Role

| Field       | Type       | Schema attributes / relation |
| ----------- | ---------- | ---------------------------- |
| `id`        | `String`   | @id @default(cuid())         |
| `name`      | `RoleName` | @unique                      |
| `users`     | `User[]`   |                              |
| `createdAt` | `DateTime` | @default(now())              |
| `updatedAt` | `DateTime` | @updatedAt                   |

### Branch

| Field                   | Type                           | Schema attributes / relation |
| ----------------------- | ------------------------------ | ---------------------------- |
| `id`                    | `String`                       | @id @default(cuid())         |
| `name`                  | `String`                       | @unique                      |
| `code`                  | `String`                       | @unique                      |
| `isActive`              | `Boolean`                      | @default(true)               |
| `userBranches`          | `UserBranch[]`                 |                              |
| `sales`                 | `Sale[]`                       |                              |
| `serviceSales`          | `ServiceSale[]`                |                              |
| `patientVisits`         | `PatientVisit[]`               |                              |
| `feedback`              | `FeedbackEntry[]`              |                              |
| `coreInvestments`       | `CoreInvestment[]`             |                              |
| `branchSalaries`        | `BranchSalary[]`               |                              |
| `branchRents`           | `BranchRent[]`                 |                              |
| `waterBills`            | `BranchWaterBill[]`            |                              |
| `powerBills`            | `BranchPowerBill[]`            |                              |
| `foodGroceries`         | `BranchFoodGroceries[]`        |                              |
| `governmentFees`        | `BranchGovernmentFee[]`        |                              |
| `investmentPurchases`   | `BranchInvestmentPurchase[]`   |                              |
| `miscellaneousExpenses` | `BranchMiscellaneousExpense[]` |                              |
| `createdAt`             | `DateTime`                     | @default(now())              |
| `updatedAt`             | `DateTime`                     | @updatedAt                   |

Index: `@@index([isActive])`.

### User

| Field           | Type               | Schema attributes / relation                  |
| --------------- | ------------------ | --------------------------------------------- |
| `id`            | `String`           | @id @default(cuid())                          |
| `name`          | `String`           |                                               |
| `email`         | `String`           | @unique                                       |
| `passwordHash`  | `String`           |                                               |
| `roleId`        | `String`           |                                               |
| `isActive`      | `Boolean`          | @default(true)                                |
| `isVerified`    | `Boolean`          | @default(true)                                |
| `lastLoginAt`   | `DateTime?`        |                                               |
| `mobileNumber`  | `String?`          | @db.VarChar(30)                               |
| `role`          | `Role`             | @relation(fields: [roleId], references: [id]) |
| `branches`      | `UserBranch[]`     |                                               |
| `permissions`   | `UserPermission[]` |                                               |
| `refreshTokens` | `RefreshToken[]`   |                                               |
| `auditLogs`     | `AuditLog[]`       |                                               |
| `createdAt`     | `DateTime`         | @default(now())                               |
| `updatedAt`     | `DateTime`         | @updatedAt                                    |

Index: `@@index([roleId])`.
Index: `@@index([isActive])`.

### UserBranch

| Field       | Type       | Schema attributes / relation                                       |
| ----------- | ---------- | ------------------------------------------------------------------ |
| `userId`    | `String`   |                                                                    |
| `branchId`  | `String`   |                                                                    |
| `user`      | `User`     | @relation(fields: [userId], references: [id], onDelete: Cascade)   |
| `branch`    | `Branch`   | @relation(fields: [branchId], references: [id], onDelete: Cascade) |
| `createdAt` | `DateTime` | @default(now())                                                    |

Index: `@@id([userId, branchId])`.
Index: `@@index([branchId])`.

### Permission

| Field         | Type               | Schema attributes / relation |
| ------------- | ------------------ | ---------------------------- |
| `id`          | `String`           | @id @default(cuid())         |
| `key`         | `String`           | @unique                      |
| `name`        | `String`           | @db.VarChar(160)             |
| `description` | `String?`          | @db.VarChar(500)             |
| `users`       | `UserPermission[]` |                              |
| `createdAt`   | `DateTime`         | @default(now())              |
| `updatedAt`   | `DateTime`         | @updatedAt                   |

### UserPermission

| Field          | Type         | Schema attributes / relation                                           |
| -------------- | ------------ | ---------------------------------------------------------------------- |
| `userId`       | `String`     |                                                                        |
| `permissionId` | `String`     |                                                                        |
| `grantedById`  | `String`     |                                                                        |
| `grantedAt`    | `DateTime`   | @default(now())                                                        |
| `user`         | `User`       | @relation(fields: [userId], references: [id], onDelete: Cascade)       |
| `permission`   | `Permission` | @relation(fields: [permissionId], references: [id], onDelete: Cascade) |

Index: `@@id([userId, permissionId])`.
Index: `@@index([permissionId])`.
Index: `@@index([grantedById])`.

### RefreshToken

| Field               | Type        | Schema attributes / relation                                     |
| ------------------- | ----------- | ---------------------------------------------------------------- |
| `id`                | `String`    | @id @default(cuid())                                             |
| `userId`            | `String`    |                                                                  |
| `tokenHash`         | `String`    | @unique                                                          |
| `expiresAt`         | `DateTime`  |                                                                  |
| `revokedAt`         | `DateTime?` |                                                                  |
| `replacedByTokenId` | `String?`   |                                                                  |
| `userAgent`         | `String?`   | @db.VarChar(512)                                                 |
| `ipAddress`         | `String?`   | @db.VarChar(64)                                                  |
| `user`              | `User`      | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `createdAt`         | `DateTime`  | @default(now())                                                  |

Index: `@@index([userId])`.
Index: `@@index([expiresAt])`.
Index: `@@index([revokedAt])`.

### Item

| Field       | Type         | Schema attributes / relation |
| ----------- | ------------ | ---------------------------- |
| `id`        | `String`     | @id @default(cuid())         |
| `name`      | `String`     |                              |
| `type`      | `ItemType`   |                              |
| `isActive`  | `Boolean`    | @default(true)               |
| `saleItems` | `SaleItem[]` |                              |
| `createdAt` | `DateTime`   | @default(now())              |
| `updatedAt` | `DateTime`   | @updatedAt                   |

Index: `@@unique([name, type])`.
Index: `@@index([isActive])`.
Index: `@@index([name])`.

### Service

| Field          | Type            | Schema attributes / relation |
| -------------- | --------------- | ---------------------------- |
| `id`           | `String`        | @id @default(cuid())         |
| `name`         | `String`        | @unique                      |
| `type`         | `ServiceType`   |                              |
| `isActive`     | `Boolean`       | @default(true)               |
| `serviceSales` | `ServiceSale[]` |                              |
| `createdAt`    | `DateTime`      | @default(now())              |
| `updatedAt`    | `DateTime`      | @updatedAt                   |

Index: `@@index([type])`.
Index: `@@index([isActive])`.

### Sale

| Field            | Type         | Schema attributes / relation                    |
| ---------------- | ------------ | ----------------------------------------------- |
| `id`             | `String`     | @id @default(cuid())                            |
| `date`           | `DateTime`   | @db.Date                                        |
| `branchId`       | `String`     |                                                 |
| `entryType`      | `EntryType`  |                                                 |
| `subtotal`       | `Decimal`    | @db.Decimal(12, 2)                              |
| `gstPercentage`  | `Decimal`    | @db.Decimal(5, 2)                               |
| `gstAmount`      | `Decimal`    | @db.Decimal(12, 2)                              |
| `sgstPercentage` | `Decimal`    | @db.Decimal(5, 2)                               |
| `sgstAmount`     | `Decimal`    | @db.Decimal(12, 2)                              |
| `cgstPercentage` | `Decimal`    | @db.Decimal(5, 2) @default(0)                   |
| `cgstAmount`     | `Decimal`    | @db.Decimal(12, 2) @default(0)                  |
| `totalAmount`    | `Decimal`    | @db.Decimal(12, 2)                              |
| `branch`         | `Branch`     | @relation(fields: [branchId], references: [id]) |
| `items`          | `SaleItem[]` |                                                 |
| `createdById`    | `String`     |                                                 |
| `updatedById`    | `String`     |                                                 |
| `createdAt`      | `DateTime`   | @default(now())                                 |
| `updatedAt`      | `DateTime`   | @updatedAt                                      |

Index: `@@index([date])`.
Index: `@@index([branchId, date])`.
Index: `@@index([entryType, date])`.

### SaleItem

| Field              | Type       | Schema attributes / relation                                      |
| ------------------ | ---------- | ----------------------------------------------------------------- |
| `id`               | `String`   | @id @default(cuid())                                              |
| `sale`             | `Sale`     | @relation(fields: [saleId], references: [id], onDelete: Cascade)  |
| `saleId`           | `String`   |                                                                   |
| `item`             | `Item`     | @relation(fields: [itemId], references: [id], onDelete: Restrict) |
| `itemId`           | `String`   |                                                                   |
| `itemNameSnapshot` | `String`   |                                                                   |
| `unitSold`         | `Int`      |                                                                   |
| `unitPrice`        | `Decimal`  | @db.Decimal(12, 2)                                                |
| `totalPrice`       | `Decimal`  | @db.Decimal(12, 2)                                                |
| `createdAt`        | `DateTime` | @default(now())                                                   |
| `updatedAt`        | `DateTime` | @updatedAt                                                        |

Index: `@@index([saleId])`.
Index: `@@index([itemId])`.

### ServiceSale

| Field                 | Type          | Schema attributes / relation                                        |
| --------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                  | `String`      | @id @default(cuid())                                                |
| `date`                | `DateTime`    | @db.Date                                                            |
| `branchId`            | `String`      |                                                                     |
| `branch`              | `Branch`      | @relation(fields: [branchId], references: [id])                     |
| `service`             | `Service?`    | @relation(fields: [serviceId], references: [id], onDelete: SetNull) |
| `serviceId`           | `String?`     |                                                                     |
| `serviceType`         | `ServiceType` |                                                                     |
| `serviceNameSnapshot` | `String`      |                                                                     |
| `amount`              | `Decimal`     | @db.Decimal(12, 2)                                                  |
| `createdById`         | `String`      |                                                                     |
| `updatedById`         | `String`      |                                                                     |
| `createdAt`           | `DateTime`    | @default(now())                                                     |
| `updatedAt`           | `DateTime`    | @updatedAt                                                          |

Index: `@@index([date])`.
Index: `@@index([branchId, date])`.

### PatientVisit

| Field              | Type       | Schema attributes / relation                    |
| ------------------ | ---------- | ----------------------------------------------- |
| `id`               | `String`   | @id @default(cuid())                            |
| `date`             | `DateTime` | @db.Date                                        |
| `branchId`         | `String`   |                                                 |
| `newPatients`      | `Int`      |                                                 |
| `followupPatients` | `Int`      |                                                 |
| `branch`           | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `createdById`      | `String`   |                                                 |
| `updatedById`      | `String`   |                                                 |
| `createdAt`        | `DateTime` | @default(now())                                 |
| `updatedAt`        | `DateTime` | @updatedAt                                      |

Index: `@@index([date])`.
Index: `@@index([branchId, date])`.

### FeedbackEntry

| Field                 | Type          | Schema attributes / relation                    |
| --------------------- | ------------- | ----------------------------------------------- |
| `id`                  | `String`      | @id @default(cuid())                            |
| `date`                | `DateTime`    | @db.Date                                        |
| `branchId`            | `String`      |                                                 |
| `doctor`              | `String`      | @db.VarChar(160)                                |
| `service`             | `String`      | @db.VarChar(160)                                |
| `patientType`         | `PatientType` |                                                 |
| `filledBy`            | `FilledBy`    |                                                 |
| `frontdeskRating`     | `Int`         |                                                 |
| `posttreatmentRating` | `Int`         |                                                 |
| `comments`            | `String?`     | @db.Text                                        |
| `branch`              | `Branch`      | @relation(fields: [branchId], references: [id]) |
| `createdById`         | `String`      |                                                 |
| `updatedById`         | `String`      |                                                 |
| `createdAt`           | `DateTime`    | @default(now())                                 |
| `updatedAt`           | `DateTime`    | @updatedAt                                      |

Index: `@@index([date])`.
Index: `@@index([branchId, date])`.

### CourseDoctor

| Field         | Type           | Schema attributes / relation |
| ------------- | -------------- | ---------------------------- |
| `id`          | `String`       | @id @default(cuid())         |
| `name`        | `String`       | @unique @db.VarChar(160)     |
| `isActive`    | `Boolean`      | @default(true)               |
| `courses`     | `Course[]`     |                              |
| `courseSales` | `CourseSale[]` |                              |
| `createdAt`   | `DateTime`     | @default(now())              |
| `updatedAt`   | `DateTime`     | @updatedAt                   |

Index: `@@index([isActive])`.
Index: `@@index([name])`.

### Course

| Field            | Type           | Schema attributes / relation                          |
| ---------------- | -------------- | ----------------------------------------------------- |
| `id`             | `String`       | @id @default(cuid())                                  |
| `name`           | `String`       | @unique @db.VarChar(160)                              |
| `courseDoctorId` | `String`       |                                                       |
| `courseDoctor`   | `CourseDoctor` | @relation(fields: [courseDoctorId], references: [id]) |
| `isActive`       | `Boolean`      | @default(true)                                        |
| `sales`          | `CourseSale[]` |                                                       |
| `createdAt`      | `DateTime`     | @default(now())                                       |
| `updatedAt`      | `DateTime`     | @updatedAt                                            |

Index: `@@index([isActive])`.
Index: `@@index([name])`.
Index: `@@index([courseDoctorId])`.

### CardType

| Field          | Type         | Schema attributes / relation |
| -------------- | ------------ | ---------------------------- |
| `id`           | `String`     | @id @default(cuid())         |
| `name`         | `String`     | @unique @db.VarChar(160)     |
| `defaultPrice` | `Decimal`    | @db.Decimal(12, 2)           |
| `isActive`     | `Boolean`    | @default(true)               |
| `sales`        | `CardSale[]` |                              |
| `createdAt`    | `DateTime`   | @default(now())              |
| `updatedAt`    | `DateTime`   | @updatedAt                   |

Index: `@@index([isActive])`.
Index: `@@index([name])`.

### Loan

| Field            | Type              | Schema attributes / relation |
| ---------------- | ----------------- | ---------------------------- |
| `id`             | `String`          | @id @default(cuid())         |
| `name`           | `String`          | @unique @db.VarChar(160)     |
| `originalAmount` | `Decimal`         | @db.Decimal(14, 2)           |
| `isActive`       | `Boolean`         | @default(true)               |
| `repayments`     | `LoanRepayment[]` |                              |
| `createdAt`      | `DateTime`        | @default(now())              |
| `updatedAt`      | `DateTime`        | @updatedAt                   |

Index: `@@index([isActive])`.
Index: `@@index([name])`.

### LegacyDirector

This is the legacy `Director` table retained for compatibility with historical salary rows. New salary records are associated with `User` accounts whose role is `DIRECTOR`.

| Field       | Type               | Schema attributes / relation |
| ----------- | ------------------ | ---------------------------- |
| `id`        | `String`           | @id @default(cuid())         |
| `name`      | `String`           | @unique @db.VarChar(160)     |
| `isActive`  | `Boolean`          | @default(true)               |
| `salaries`  | `DirectorSalary[]` |                              |
| `createdAt` | `DateTime`         | @default(now())              |
| `updatedAt` | `DateTime`         | @updatedAt                   |

Index: `@@index([isActive])`.
Index: `@@index([name])`.

### CourseSale

| Field             | Type                 | Schema attributes / relation                          |
| ----------------- | -------------------- | ----------------------------------------------------- |
| `id`              | `String`             | @id @default(cuid())                                  |
| `courseId`        | `String`             |                                                       |
| `course`          | `Course`             | @relation(fields: [courseId], references: [id])       |
| `courseDoctorId`  | `String`             |                                                       |
| `courseDoctor`    | `CourseDoctor`       | @relation(fields: [courseDoctorId], references: [id]) |
| `purchaseDate`    | `DateTime`           | @db.Date                                              |
| `numberOfCourses` | `Int`                |                                                       |
| `pricePerCourse`  | `Decimal`            | @db.Decimal(12, 2)                                    |
| `discount`        | `Decimal`            | @db.Decimal(12, 2) @default(0)                        |
| `totalAmount`     | `Decimal`            | @db.Decimal(12, 2)                                    |
| `customerId`      | `String`             | @db.VarChar(160)                                      |
| `membershipType`  | `CardMembershipType` |                                                       |
| `createdById`     | `String`             |                                                       |
| `updatedById`     | `String`             |                                                       |
| `createdAt`       | `DateTime`           | @default(now())                                       |
| `updatedAt`       | `DateTime`           | @updatedAt                                            |

Index: `@@index([purchaseDate])`.
Index: `@@index([courseId])`.
Index: `@@index([courseDoctorId])`.

### CardSale

| Field           | Type       | Schema attributes / relation                      |
| --------------- | ---------- | ------------------------------------------------- |
| `id`            | `String`   | @id @default(cuid())                              |
| `date`          | `DateTime` | @db.Date                                          |
| `cardTypeId`    | `String`   |                                                   |
| `cardType`      | `CardType` | @relation(fields: [cardTypeId], references: [id]) |
| `cardPrice`     | `Decimal`  | @db.Decimal(12, 2)                                |
| `numberOfCards` | `Int`      |                                                   |
| `totalAmount`   | `Decimal`  | @db.Decimal(12, 2)                                |
| `createdById`   | `String`   |                                                   |
| `updatedById`   | `String`   |                                                   |
| `createdAt`     | `DateTime` | @default(now())                                   |
| `updatedAt`     | `DateTime` | @updatedAt                                        |

Index: `@@index([date])`.
Index: `@@index([cardTypeId])`.

### CoreInvestment

| Field         | Type               | Schema attributes / relation                    |
| ------------- | ------------------ | ----------------------------------------------- |
| `id`          | `String`           | @id @default(cuid())                            |
| `itemName`    | `String`           | @db.VarChar(160)                                |
| `invoiceId`   | `String`           | @db.VarChar(80)                                 |
| `price`       | `Decimal`          | @db.Decimal(12, 2)                              |
| `billingDate` | `DateTime`         | @db.Date                                        |
| `paymentDate` | `DateTime`         | @db.Date                                        |
| `gst`         | `Decimal`          | @db.Decimal(5, 2) @default(0)                   |
| `sgst`        | `Decimal`          | @db.Decimal(5, 2) @default(0)                   |
| `gstAmount`   | `Decimal`          | @db.Decimal(12, 2) @default(0)                  |
| `sgstAmount`  | `Decimal`          | @db.Decimal(12, 2) @default(0)                  |
| `totalAmount` | `Decimal`          | @db.Decimal(12, 2) @default(0)                  |
| `belongsTo`   | `ExpenseOwnerType` |                                                 |
| `branchId`    | `String?`          |                                                 |
| `branch`      | `Branch?`          | @relation(fields: [branchId], references: [id]) |
| `createdById` | `String`           |                                                 |
| `updatedById` | `String`           |                                                 |
| `createdAt`   | `DateTime`         | @default(now())                                 |
| `updatedAt`   | `DateTime`         | @updatedAt                                      |

Index: `@@index([paymentDate])`.
Index: `@@index([belongsTo])`.
Index: `@@index([branchId])`.

### MedicinePurchase

| Field         | Type       | Schema attributes / relation   |
| ------------- | ---------- | ------------------------------ |
| `id`          | `String`   | @id @default(cuid())           |
| `invoiceId`   | `String`   | @db.VarChar(80)                |
| `price`       | `Decimal`  | @db.Decimal(12, 2)             |
| `billingDate` | `DateTime` | @db.Date                       |
| `paymentDate` | `DateTime` | @db.Date                       |
| `gst`         | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `sgst`        | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `gstAmount`   | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `sgstAmount`  | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `totalAmount` | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `createdById` | `String`   |                                |
| `updatedById` | `String`   |                                |
| `createdAt`   | `DateTime` | @default(now())                |
| `updatedAt`   | `DateTime` | @updatedAt                     |

Index: `@@index([paymentDate])`.
Index: `@@index([invoiceId])`.

### MarketingExpense

| Field          | Type       | Schema attributes / relation   |
| -------------- | ---------- | ------------------------------ |
| `id`           | `String`   | @id @default(cuid())           |
| `companyName`  | `String`   | @db.VarChar(160)               |
| `invoiceId`    | `String`   | @db.VarChar(80)                |
| `price`        | `Decimal`  | @db.Decimal(12, 2)             |
| `billingDate`  | `DateTime` | @db.Date                       |
| `paymentDate`  | `DateTime` | @db.Date                       |
| `gst`          | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `sgst`         | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `gstAmount`    | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `sgstAmount`   | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `totalAmount`  | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `expenseMonth` | `Month`    |                                |
| `expenseYear`  | `Int`      |                                |
| `createdById`  | `String`   |                                |
| `updatedById`  | `String`   |                                |
| `createdAt`    | `DateTime` | @default(now())                |
| `updatedAt`    | `DateTime` | @updatedAt                     |

Index: `@@index([paymentDate])`.
Index: `@@index([expenseYear, expenseMonth])`.

### CsrFund

| Field                  | Type       | Schema attributes / relation |
| ---------------------- | ---------- | ---------------------------- |
| `id`                   | `String`   | @id @default(cuid())         |
| `month`                | `Month`    |                              |
| `year`                 | `Int`      |                              |
| `lastMonthTotalIncome` | `Decimal`  | @db.Decimal(14, 2)           |
| `percentage`           | `Decimal`  | @db.Decimal(5, 2)            |
| `amount`               | `Decimal`  | @db.Decimal(14, 2)           |
| `createdById`          | `String`   |                              |
| `updatedById`          | `String`   |                              |
| `createdAt`            | `DateTime` | @default(now())              |
| `updatedAt`            | `DateTime` | @updatedAt                   |

Index: `@@unique([year, month])`.
Index: `@@index([year])`.

### LoanRepayment

| Field             | Type       | Schema attributes / relation                  |
| ----------------- | ---------- | --------------------------------------------- |
| `id`              | `String`   | @id @default(cuid())                          |
| `loanId`          | `String`   |                                               |
| `loan`            | `Loan`     | @relation(fields: [loanId], references: [id]) |
| `month`           | `Month`    |                                               |
| `year`            | `Int`      |                                               |
| `repaymentAmount` | `Decimal`  | @db.Decimal(14, 2)                            |
| `createdById`     | `String`   |                                               |
| `updatedById`     | `String`   |                                               |
| `createdAt`       | `DateTime` | @default(now())                               |
| `updatedAt`       | `DateTime` | @updatedAt                                    |

Index: `@@index([loanId])`.
Index: `@@index([year, month])`.

### AdvanceTax

| Field         | Type       | Schema attributes / relation |
| ------------- | ---------- | ---------------------------- |
| `id`          | `String`   | @id @default(cuid())         |
| `month`       | `Month`    |                              |
| `year`        | `Int`      |                              |
| `amountPaid`  | `Decimal`  | @db.Decimal(14, 2)           |
| `createdById` | `String`   |                              |
| `updatedById` | `String`   |                              |
| `createdAt`   | `DateTime` | @default(now())              |
| `updatedAt`   | `DateTime` | @updatedAt                   |

Index: `@@index([year, month])`.

### OtherExpense

| Field         | Type       | Schema attributes / relation   |
| ------------- | ---------- | ------------------------------ |
| `id`          | `String`   | @id @default(cuid())           |
| `itemName`    | `String`   | @db.VarChar(160)               |
| `invoiceId`   | `String`   | @db.VarChar(80)                |
| `price`       | `Decimal`  | @db.Decimal(12, 2)             |
| `billingDate` | `DateTime` | @db.Date                       |
| `paymentDate` | `DateTime` | @db.Date                       |
| `gst`         | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `sgst`        | `Decimal`  | @db.Decimal(5, 2) @default(0)  |
| `gstAmount`   | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `sgstAmount`  | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `totalAmount` | `Decimal`  | @db.Decimal(12, 2) @default(0) |
| `year`        | `Int`      |                                |
| `createdById` | `String`   |                                |
| `updatedById` | `String`   |                                |
| `createdAt`   | `DateTime` | @default(now())                |
| `updatedAt`   | `DateTime` | @updatedAt                     |

Index: `@@index([paymentDate])`.
Index: `@@index([year])`.

### DirectorSalary

| Field                  | Type              | Schema attributes / relation                                             |
| ---------------------- | ----------------- | ------------------------------------------------------------------------ |
| `id`                   | `String`          | @id @default(cuid())                                                     |
| `month`                | `Month`           |                                                                          |
| `year`                 | `Int`             |                                                                          |
| `directorId`           | `String?`         | Legacy director relation, when present                                   |
| `director`             | `LegacyDirector?` | @relation(fields: [directorId], references: [id])                        |
| `directorUserId`       | `String?`         | User account relation for current director salary records                |
| `directorUser`         | `User?`           | @relation(fields: [directorUserId], references: [id], onDelete: SetNull) |
| `directorNameSnapshot` | `String?`         | @db.VarChar(160); preserves display name                                 |
| `amount`               | `Decimal`         | @db.Decimal(14, 2)                                                       |
| `createdById`          | `String`          |                                                                          |
| `updatedById`          | `String`          |                                                                          |
| `createdAt`            | `DateTime`        | @default(now())                                                          |
| `updatedAt`            | `DateTime`        | @updatedAt                                                               |

Index: `@@index([year, month])`.
Index: `@@index([directorId])`.
Index: `@@index([directorUserId])`.

### CompanyMiscellaneousExpense

| Field           | Type            | Schema attributes / relation   |
| --------------- | --------------- | ------------------------------ |
| `id`            | `String`        | @id @default(cuid())           |
| `itemName`      | `String`        | @db.VarChar(160)               |
| `voucherId`     | `String`        | @db.VarChar(80)                |
| `price`         | `Decimal`       | @db.Decimal(12, 2)             |
| `date`          | `DateTime`      | @db.Date                       |
| `gst`           | `Decimal`       | @db.Decimal(5, 2) @default(0)  |
| `sgst`          | `Decimal`       | @db.Decimal(5, 2) @default(0)  |
| `gstAmount`     | `Decimal`       | @db.Decimal(12, 2) @default(0) |
| `sgstAmount`    | `Decimal`       | @db.Decimal(12, 2) @default(0) |
| `totalAmount`   | `Decimal`       | @db.Decimal(12, 2) @default(0) |
| `paymentMethod` | `PaymentMethod` |                                |
| `createdById`   | `String`        |                                |
| `updatedById`   | `String`        |                                |
| `createdAt`     | `DateTime`      | @default(now())                |
| `updatedAt`     | `DateTime`      | @updatedAt                     |

Index: `@@index([date])`.
Index: `@@index([voucherId])`.

### BranchSalary

| Field          | Type       | Schema attributes / relation                    |
| -------------- | ---------- | ----------------------------------------------- |
| `id`           | `String`   | @id @default(cuid())                            |
| `branchId`     | `String`   |                                                 |
| `branch`       | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `personName`   | `String`   | @db.VarChar(160)                                |
| `role`         | `String`   | @db.VarChar(160)                                |
| `month`        | `Month`    |                                                 |
| `year`         | `Int`      |                                                 |
| `salary`       | `Decimal`  | @db.Decimal(14, 2)                              |
| `dateCredited` | `DateTime` | @db.Date                                        |
| `totalAmount`  | `Decimal`  | @db.Decimal(14, 2)                              |
| `createdById`  | `String`   |                                                 |
| `updatedById`  | `String`   |                                                 |
| `createdAt`    | `DateTime` | @default(now())                                 |
| `updatedAt`    | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year, month])`.
Index: `@@index([dateCredited])`.

### BranchRent

| Field           | Type       | Schema attributes / relation                    |
| --------------- | ---------- | ----------------------------------------------- |
| `id`            | `String`   | @id @default(cuid())                            |
| `branchId`      | `String`   |                                                 |
| `branch`        | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `month`         | `Month`    |                                                 |
| `year`          | `Int`      |                                                 |
| `invoiceId`     | `String`   | @db.VarChar(80)                                 |
| `rentAmount`    | `Decimal`  | @db.Decimal(14, 2)                              |
| `tdsPercentage` | `Decimal`  | @db.Decimal(5, 2)                               |
| `tdsDeduction`  | `Decimal`  | @db.Decimal(14, 2)                              |
| `netAmount`     | `Decimal`  | @db.Decimal(14, 2)                              |
| `createdById`   | `String`   |                                                 |
| `updatedById`   | `String`   |                                                 |
| `createdAt`     | `DateTime` | @default(now())                                 |
| `updatedAt`     | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year, month])`.
Index: `@@index([invoiceId])`.

### BranchWaterBill

| Field          | Type       | Schema attributes / relation                    |
| -------------- | ---------- | ----------------------------------------------- |
| `id`           | `String`   | @id @default(cuid())                            |
| `branchId`     | `String`   |                                                 |
| `branch`       | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `amount`       | `Decimal`  | @db.Decimal(14, 2)                              |
| `billId`       | `String`   | @db.VarChar(80)                                 |
| `paidDate`     | `DateTime` | @db.Date                                        |
| `assignedDate` | `DateTime` | @db.Date                                        |
| `month`        | `Month`    |                                                 |
| `year`         | `Int`      |                                                 |
| `createdById`  | `String`   |                                                 |
| `updatedById`  | `String`   |                                                 |
| `createdAt`    | `DateTime` | @default(now())                                 |
| `updatedAt`    | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year, month])`.
Index: `@@index([paidDate])`.

### BranchPowerBill

| Field          | Type       | Schema attributes / relation                    |
| -------------- | ---------- | ----------------------------------------------- |
| `id`           | `String`   | @id @default(cuid())                            |
| `branchId`     | `String`   |                                                 |
| `branch`       | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `amount`       | `Decimal`  | @db.Decimal(14, 2)                              |
| `billId`       | `String`   | @db.VarChar(80)                                 |
| `assignedDate` | `DateTime` | @db.Date                                        |
| `paidDate`     | `DateTime` | @db.Date                                        |
| `month`        | `Month`    |                                                 |
| `year`         | `Int`      |                                                 |
| `createdById`  | `String`   |                                                 |
| `updatedById`  | `String`   |                                                 |
| `createdAt`    | `DateTime` | @default(now())                                 |
| `updatedAt`    | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year, month])`.
Index: `@@index([paidDate])`.

### BranchFoodGroceries

| Field         | Type       | Schema attributes / relation                    |
| ------------- | ---------- | ----------------------------------------------- |
| `id`          | `String`   | @id @default(cuid())                            |
| `branchId`    | `String`   |                                                 |
| `branch`      | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `invoiceId`   | `String`   | @db.VarChar(80)                                 |
| `amount`      | `Decimal`  | @db.Decimal(14, 2)                              |
| `date`        | `DateTime` | @db.Date                                        |
| `month`       | `Month`    |                                                 |
| `year`        | `Int`      |                                                 |
| `totalAmount` | `Decimal`  | @db.Decimal(14, 2)                              |
| `createdById` | `String`   |                                                 |
| `updatedById` | `String`   |                                                 |
| `createdAt`   | `DateTime` | @default(now())                                 |
| `updatedAt`   | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year, month])`.
Index: `@@index([date])`.

### BranchGovernmentFee

| Field         | Type       | Schema attributes / relation                    |
| ------------- | ---------- | ----------------------------------------------- |
| `id`          | `String`   | @id @default(cuid())                            |
| `branchId`    | `String`   |                                                 |
| `branch`      | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `itemName`    | `String`   | @db.VarChar(160)                                |
| `invoiceId`   | `String`   | @db.VarChar(80)                                 |
| `price`       | `Decimal`  | @db.Decimal(12, 2)                              |
| `date`        | `DateTime` | @db.Date                                        |
| `gst`         | `Decimal`  | @db.Decimal(5, 2) @default(0)                   |
| `sgst`        | `Decimal`  | @db.Decimal(5, 2) @default(0)                   |
| `gstAmount`   | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `sgstAmount`  | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `year`        | `Int`      |                                                 |
| `totalAmount` | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `createdById` | `String`   |                                                 |
| `updatedById` | `String`   |                                                 |
| `createdAt`   | `DateTime` | @default(now())                                 |
| `updatedAt`   | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year])`.
Index: `@@index([date])`.

### BranchInvestmentPurchase

| Field         | Type       | Schema attributes / relation                    |
| ------------- | ---------- | ----------------------------------------------- |
| `id`          | `String`   | @id @default(cuid())                            |
| `branchId`    | `String`   |                                                 |
| `branch`      | `Branch`   | @relation(fields: [branchId], references: [id]) |
| `itemName`    | `String`   | @db.VarChar(160)                                |
| `invoiceId`   | `String`   | @db.VarChar(80)                                 |
| `price`       | `Decimal`  | @db.Decimal(12, 2)                              |
| `date`        | `DateTime` | @db.Date                                        |
| `gst`         | `Decimal`  | @db.Decimal(5, 2) @default(0)                   |
| `sgst`        | `Decimal`  | @db.Decimal(5, 2) @default(0)                   |
| `gstAmount`   | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `sgstAmount`  | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `year`        | `Int`      |                                                 |
| `totalAmount` | `Decimal`  | @db.Decimal(12, 2) @default(0)                  |
| `createdById` | `String`   |                                                 |
| `updatedById` | `String`   |                                                 |
| `createdAt`   | `DateTime` | @default(now())                                 |
| `updatedAt`   | `DateTime` | @updatedAt                                      |

Index: `@@index([branchId, year])`.
Index: `@@index([date])`.

### BranchMiscellaneousExpense

| Field           | Type            | Schema attributes / relation                    |
| --------------- | --------------- | ----------------------------------------------- |
| `id`            | `String`        | @id @default(cuid())                            |
| `branchId`      | `String`        |                                                 |
| `branch`        | `Branch`        | @relation(fields: [branchId], references: [id]) |
| `itemName`      | `String`        | @db.VarChar(160)                                |
| `voucherId`     | `String`        | @db.VarChar(80)                                 |
| `price`         | `Decimal`       | @db.Decimal(12, 2)                              |
| `date`          | `DateTime`      | @db.Date                                        |
| `gst`           | `Decimal`       | @db.Decimal(5, 2) @default(0)                   |
| `sgst`          | `Decimal`       | @db.Decimal(5, 2) @default(0)                   |
| `gstAmount`     | `Decimal`       | @db.Decimal(12, 2) @default(0)                  |
| `sgstAmount`    | `Decimal`       | @db.Decimal(12, 2) @default(0)                  |
| `paymentMethod` | `PaymentMethod` |                                                 |
| `year`          | `Int`           |                                                 |
| `totalAmount`   | `Decimal`       | @db.Decimal(12, 2) @default(0)                  |
| `createdById`   | `String`        |                                                 |
| `updatedById`   | `String`        |                                                 |
| `createdAt`     | `DateTime`      | @default(now())                                 |
| `updatedAt`     | `DateTime`      | @updatedAt                                      |

Index: `@@index([branchId, year])`.
Index: `@@index([date])`.
Index: `@@index([voucherId])`.

### AuditLog

| Field          | Type       | Schema attributes / relation                                     |
| -------------- | ---------- | ---------------------------------------------------------------- |
| `id`           | `String`   | @id @default(cuid())                                             |
| `userId`       | `String?`  |                                                                  |
| `user`         | `User?`    | @relation(fields: [userId], references: [id], onDelete: SetNull) |
| `action`       | `String`   | @db.VarChar(120)                                                 |
| `resourceType` | `String`   | @db.VarChar(80)                                                  |
| `resourceId`   | `String?`  | @db.VarChar(191)                                                 |
| `metadata`     | `Json?`    |                                                                  |
| `ipAddress`    | `String?`  | @db.VarChar(64)                                                  |
| `userAgent`    | `String?`  | @db.VarChar(512)                                                 |
| `createdAt`    | `DateTime` | @default(now())                                                  |

Index: `@@index([userId])`.
Index: `@@index([resourceType, resourceId(length: 128)])`.
Index: `@@index([createdAt])`.
