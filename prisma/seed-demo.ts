import "dotenv/config";
import "dotenv/config";
import {
    CardMembershipType,
    EntryType,
    ExpenseOwnerType,
    FilledBy,
    ItemType,
    Month,
    PatientType,
    PaymentMethod,
    PrismaClient,
    ServiceType,
    type Prisma,
} from "@prisma/client";
import { BRANCH_SEEDS } from "../src/constants/index.js";
import { ROLES } from "../src/constants/roles.js";

const prisma = new PrismaClient();
if (process.env.NODE_ENV === "production") {
    throw new Error("The mock data seeder is disabled in production.");
}
const DEMO_PREFIX = "demo-seed-v1-";
const MONTHS = [
    Month.JANUARY,
    Month.FEBRUARY,
    Month.MARCH,
    Month.APRIL,
    Month.MAY,
    Month.JUNE,
    Month.JULY,
    Month.AUGUST,
    Month.SEPTEMBER,
    Month.OCTOBER,
    Month.NOVEMBER,
    Month.DECEMBER,
];

const ITEMS = [
    { name: "Demo Ashwagandha Tablets", type: ItemType.MEDICINE, price: 420 },
    { name: "Demo Triphala Churna", type: ItemType.MEDICINE, price: 280 },
    { name: "Demo Brahmi Capsules", type: ItemType.MEDICINE, price: 360 },
    { name: "Demo Neem Capsules", type: ItemType.MEDICINE, price: 310 },
    { name: "Demo Herbal Tea", type: ItemType.OTC, price: 160 },
    { name: "Demo Ginger Candy", type: ItemType.OTC, price: 90 },
    { name: "Demo Digestive Churna", type: ItemType.OTC, price: 130 },
    { name: "Demo Herbal Balm", type: ItemType.OTC, price: 220 },
] as const;

const SERVICES = [
    { name: "Demo Consultation", type: ServiceType.CONSULTATION },
    { name: "Demo Panchakarma Therapy", type: ServiceType.THERAPY },
    { name: "Demo Abhyanga Therapy", type: ServiceType.THERAPY },
    { name: "Demo Wellness Assessment", type: ServiceType.OTHER },
] as const;

const COURSE_DOCTORS = ["Demo Dr. Asha Rao", "Demo Dr. Kiran Menon", "Demo Dr. Neel Shah"];
const COURSE_NAMES = [
    "Demo 7-Day Wellness Programme",
    "Demo 14-Day Panchakarma Programme",
    "Demo 30-Day Metabolic Care Programme",
    "Demo Seasonal Wellness Programme",
];
const CARD_TYPES = [
    { name: "Demo Green Wellness Card", defaultPrice: 400 },
    { name: "Demo Golden Wellness Card", defaultPrice: 900 },
    { name: "Demo Family Wellness Card", defaultPrice: 1400 },
];
const LOANS = [
    { name: "Demo Equipment Loan", originalAmount: 1_500_000 },
    { name: "Demo Clinic Expansion Loan", originalAmount: 3_250_000 },
];
function demoId(kind: string, sequence: number) {
    return `${DEMO_PREFIX}${kind}-${String(sequence).padStart(6, "0")}`;
}

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateInMonth(year: number, monthIndex: number, seed: number) {
    const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const day = 1 + (seed % Math.min(days, 26));
    return new Date(Date.UTC(year, monthIndex, day));
}

function monthKeys() {
    const start = new Date(Date.UTC(2024, 0, 1));
    const end = new Date();
    const result: { year: number; monthIndex: number; month: Month }[] = [];
    for (
        let cursor = new Date(start);
        cursor <= end;
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
    ) {
        const monthIndex = cursor.getUTCMonth();
        result.push({
            year: cursor.getUTCFullYear(),
            monthIndex,
            month: MONTHS[monthIndex],
        });
    }
    return result;
}

async function clearPriorDemoRows() {
    const id = { startsWith: DEMO_PREFIX };
    await prisma.auditLog.deleteMany({ where: { id } });
    await prisma.sale.deleteMany({ where: { id } });
    await prisma.serviceSale.deleteMany({ where: { id } });
    await prisma.patientVisit.deleteMany({ where: { id } });
    await prisma.feedbackEntry.deleteMany({ where: { id } });
    await prisma.courseSale.deleteMany({ where: { id } });
    await prisma.cardSale.deleteMany({ where: { id } });
    await prisma.coreInvestment.deleteMany({ where: { id } });
    await prisma.medicinePurchase.deleteMany({ where: { id } });
    await prisma.marketingExpense.deleteMany({ where: { id } });
    await prisma.csrFund.deleteMany({ where: { id } });
    await prisma.loanRepayment.deleteMany({ where: { id } });
    await prisma.advanceTax.deleteMany({ where: { id } });
    await prisma.otherExpense.deleteMany({ where: { id } });
    await prisma.directorSalary.deleteMany({ where: { id } });
    await prisma.companyMiscellaneousExpense.deleteMany({ where: { id } });
    await prisma.branchSalary.deleteMany({ where: { id } });
    await prisma.branchRent.deleteMany({ where: { id } });
    await prisma.branchWaterBill.deleteMany({ where: { id } });
    await prisma.branchPowerBill.deleteMany({ where: { id } });
    await prisma.branchFoodGroceries.deleteMany({ where: { id } });
    await prisma.branchGovernmentFee.deleteMany({ where: { id } });
    await prisma.branchInvestmentPurchase.deleteMany({ where: { id } });
    await prisma.branchMiscellaneousExpense.deleteMany({ where: { id } });
}

async function seedCatalogues() {
    const items = await Promise.all(
        ITEMS.map((item) =>
            prisma.item.upsert({
                where: { name_type: { name: item.name, type: item.type } },
                update: {},
                create: { name: item.name, type: item.type, isActive: true },
            }),
        ),
    );
    const services = await Promise.all(
        SERVICES.map((service) =>
            prisma.service.upsert({
                where: { name: service.name },
                update: {},
                create: { ...service, isActive: true },
            }),
        ),
    );

    const courseDoctors = await Promise.all(
        COURSE_DOCTORS.map((name) =>
            prisma.courseDoctor.upsert({
                where: { name },
                update: {},
                create: { name, isActive: true },
            }),
        ),
    );
    const courses = await Promise.all(
        COURSE_NAMES.map((name, index) =>
            prisma.course.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                    courseDoctorId: courseDoctors[index % courseDoctors.length].id,
                    isActive: true,
                },
            }),
        ),
    );
    const cardTypes = await Promise.all(
        CARD_TYPES.map((cardType) =>
            prisma.cardType.upsert({
                where: { name: cardType.name },
                update: {},
                create: { ...cardType, isActive: true },
            }),
        ),
    );
    const loans = await Promise.all(
        LOANS.map((loan) =>
            prisma.loan.upsert({
                where: { name: loan.name },
                update: {},
                create: { ...loan, isActive: true },
            }),
        ),
    );
    return { items, services, courseDoctors, courses, cardTypes, loans };
}

async function main() {
    const branches = await prisma.branch.findMany({
        where: { code: { in: BRANCH_SEEDS.map((b) => b.code) }, isActive: true },
    });
    const actor = await prisma.user.findUnique({ where: { email: "superadmin@sripaa.local" } });
    if (branches.length !== BRANCH_SEEDS.length || !actor) {
        throw new Error(
            "Run `npm run db:seed` first so demo branches and the local seed actor exist.",
        );
    }

    await clearPriorDemoRows();
    const catalogues = await seedCatalogues();
    const directorUsers = await prisma.user.findMany({
        where: {
            isActive: true,
            isVerified: true,
            role: { name: ROLES.DIRECTOR },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    if (!directorUsers.length) {
        throw new Error(
            "Create at least one active Director role account before seeding demo salaries.",
        );
    }
    const months = monthKeys();
    const sales: Prisma.SaleCreateManyInput[] = [];
    const saleItems: Prisma.SaleItemCreateManyInput[] = [];
    const serviceSales: Prisma.ServiceSaleCreateManyInput[] = [];
    const visits: Prisma.PatientVisitCreateManyInput[] = [];
    const feedback: Prisma.FeedbackEntryCreateManyInput[] = [];
    const courseSales: Prisma.CourseSaleCreateManyInput[] = [];
    const cardSales: Prisma.CardSaleCreateManyInput[] = [];

    let saleSequence = 1;
    let saleItemSequence = 1;
    let serviceSequence = 1;
    let visitSequence = 1;
    let feedbackSequence = 1;
    let courseSequence = 1;
    let cardSequence = 1;

    months.forEach(({ year, monthIndex }, monthOffset) => {
        branches.forEach((branch, branchIndex) => {
            for (let entry = 0; entry < 8; entry += 1) {
                const date = dateInMonth(
                    year,
                    monthIndex,
                    monthOffset * 17 + branchIndex * 11 + entry * 3,
                );
                const itemTypeOffset = (entry + branchIndex + monthOffset) % 2 === 0 ? 0 : 4;
                const lineItems = [0, 1].map((lineIndex) => {
                    const itemIndex =
                        itemTypeOffset + ((monthOffset + branchIndex + entry + lineIndex) % 4);
                    const item = catalogues.items[itemIndex];
                    const basePrice = ITEMS[itemIndex].price;
                    const unitSold = 1 + ((entry + lineIndex + monthOffset) % 4);
                    const unitPrice = roundMoney(
                        basePrice * (1 + ((branchIndex + monthOffset) % 8) / 100),
                    );
                    return {
                        item,
                        unitSold,
                        unitPrice,
                        totalPrice: roundMoney(unitSold * unitPrice),
                    };
                });
                const subtotal = lineItems.reduce((sum, line) => sum + line.totalPrice, 0);
                const gstAmount = roundMoney(subtotal * 0.025);
                const sgstAmount = roundMoney(subtotal * 0.025);
                const saleId = demoId("sale", saleSequence++);
                const entryType =
                    lineItems[0].item.type === ItemType.OTC
                        ? EntryType.OTC
                        : EntryType.DOCTOR_PRESCRIBED_MEDICINE;
                sales.push({
                    id: saleId,
                    date,
                    branchId: branch.id,
                    entryType,
                    subtotal,
                    gstPercentage: 2.5,
                    gstAmount,
                    sgstPercentage: 2.5,
                    sgstAmount,
                    cgstPercentage: 0,
                    cgstAmount: 0,
                    totalAmount: roundMoney(subtotal + gstAmount + sgstAmount),
                    createdById: actor.id,
                    updatedById: actor.id,
                });
                lineItems.forEach((line) => {
                    saleItems.push({
                        id: demoId("sale-item", saleItemSequence++),
                        saleId,
                        itemId: line.item.id,
                        itemNameSnapshot: line.item.name,
                        unitSold: line.unitSold,
                        unitPrice: line.unitPrice,
                        totalPrice: line.totalPrice,
                    });
                });
            }

            for (let entry = 0; entry < 6; entry += 1) {
                const service =
                    catalogues.services[
                        (entry + branchIndex + monthOffset) % catalogues.services.length
                    ];
                serviceSales.push({
                    id: demoId("service-sale", serviceSequence++),
                    date: dateInMonth(
                        year,
                        monthIndex,
                        monthOffset * 13 + branchIndex * 7 + entry * 4,
                    ),
                    branchId: branch.id,
                    serviceId: service.id,
                    serviceType: service.type,
                    serviceNameSnapshot: service.name,
                    amount: 650 + ((entry * 275 + branchIndex * 125 + monthOffset * 31) % 6200),
                    createdById: actor.id,
                    updatedById: actor.id,
                });
            }

            for (let entry = 0; entry < 8; entry += 1) {
                const newPatients = (entry * 3 + branchIndex + monthOffset) % 14;
                const followupPatients = (entry * 5 + branchIndex * 2 + monthOffset) % 22;
                visits.push({
                    id: demoId("visit", visitSequence++),
                    date: dateInMonth(
                        year,
                        monthIndex,
                        monthOffset * 9 + branchIndex * 5 + entry * 3,
                    ),
                    branchId: branch.id,
                    newPatients,
                    followupPatients,
                    createdById: actor.id,
                    updatedById: actor.id,
                });
            }

            for (let entry = 0; entry < 5; entry += 1) {
                const ratingBase = (entry + branchIndex + monthOffset) % 5;
                feedback.push({
                    id: demoId("feedback", feedbackSequence++),
                    date: dateInMonth(
                        year,
                        monthIndex,
                        monthOffset * 7 + branchIndex * 3 + entry * 5,
                    ),
                    branchId: branch.id,
                    doctor: COURSE_DOCTORS[(entry + branchIndex) % COURSE_DOCTORS.length],
                    service: SERVICES[(entry + monthOffset) % SERVICES.length].name,
                    patientType: entry % 4 === 0 ? PatientType.IPD : PatientType.OPD,
                    filledBy: entry % 2 === 0 ? FilledBy.PATIENT_SELF : FilledBy.STAFF,
                    frontdeskRating: 1 + ((ratingBase + 2) % 5),
                    posttreatmentRating: 1 + ((ratingBase + 3) % 5),
                    comments: [
                        "Demo feedback: staff were helpful and welcoming.",
                        "Demo feedback: consultation was clear and informative.",
                        "Demo feedback: waiting time could be improved.",
                        "Demo feedback: treatment experience was very good.",
                        null,
                    ][entry],
                    createdById: actor.id,
                    updatedById: actor.id,
                });
            }

            for (let entry = 0; entry < 3; entry += 1) {
                const course =
                    catalogues.courses[
                        (entry + branchIndex + monthOffset) % catalogues.courses.length
                    ];
                const quantity = 1 + ((entry + branchIndex) % 3);
                const price = 1800 + ((entry * 550 + monthOffset * 17) % 3200);
                const discount = (entry % 2) * 250;
                courseSales.push({
                    id: demoId("course-sale", courseSequence++),
                    courseId: course.id,
                    courseDoctorId: course.courseDoctorId,
                    purchaseDate: dateInMonth(year, monthIndex, monthOffset * 5 + entry * 8),
                    numberOfCourses: quantity,
                    pricePerCourse: price,
                    discount,
                    totalAmount: roundMoney(quantity * price - discount),
                    customerId: `DEMO-CUSTOMER-${String(courseSequence).padStart(5, "0")}`,
                    membershipType: [
                        CardMembershipType.GREEN_CARD,
                        CardMembershipType.GOLDEN_CARD,
                        CardMembershipType.OTHER,
                    ][(entry + monthOffset) % 3],
                    createdById: actor.id,
                    updatedById: actor.id,
                });
            }

            for (let entry = 0; entry < 3; entry += 1) {
                const cardType =
                    catalogues.cardTypes[
                        (entry + branchIndex + monthOffset) % catalogues.cardTypes.length
                    ];
                const quantity = 1 + ((entry + monthOffset) % 4);
                const cardPrice = Number(cardType.defaultPrice) + ((branchIndex + entry) % 3) * 25;
                cardSales.push({
                    id: demoId("card-sale", cardSequence++),
                    date: dateInMonth(
                        year,
                        monthIndex,
                        monthOffset * 6 + branchIndex * 2 + entry * 9,
                    ),
                    cardTypeId: cardType.id,
                    cardPrice,
                    numberOfCards: quantity,
                    totalAmount: roundMoney(cardPrice * quantity),
                    createdById: actor.id,
                    updatedById: actor.id,
                });
            }
        });
    });

    const branchSalaries: Prisma.BranchSalaryCreateManyInput[] = [];
    const branchRents: Prisma.BranchRentCreateManyInput[] = [];
    const branchWaterBills: Prisma.BranchWaterBillCreateManyInput[] = [];
    const branchPowerBills: Prisma.BranchPowerBillCreateManyInput[] = [];
    const branchFood: Prisma.BranchFoodGroceriesCreateManyInput[] = [];
    const branchFees: Prisma.BranchGovernmentFeeCreateManyInput[] = [];
    const branchInvestments: Prisma.BranchInvestmentPurchaseCreateManyInput[] = [];
    const branchMisc: Prisma.BranchMiscellaneousExpenseCreateManyInput[] = [];
    const branchCoreInvestments: Prisma.CoreInvestmentCreateManyInput[] = [];
    let expenseSequence = 1;

    const corporateCoreInvestments: Prisma.CoreInvestmentCreateManyInput[] = [];
    const medicinePurchases: Prisma.MedicinePurchaseCreateManyInput[] = [];
    const marketingExpenses: Prisma.MarketingExpenseCreateManyInput[] = [];
    const csrFunds: Prisma.CsrFundCreateManyInput[] = [];
    const loanRepayments: Prisma.LoanRepaymentCreateManyInput[] = [];
    const advanceTaxes: Prisma.AdvanceTaxCreateManyInput[] = [];
    const otherExpenses: Prisma.OtherExpenseCreateManyInput[] = [];
    const directorSalaries: Prisma.DirectorSalaryCreateManyInput[] = [];
    const companyMisc: Prisma.CompanyMiscellaneousExpenseCreateManyInput[] = [];

    months.forEach(({ year, monthIndex, month }, monthOffset) => {
        branches.forEach((branch, branchIndex) => {
            const billDate = dateInMonth(year, monthIndex, monthOffset * 5 + branchIndex * 3);
            branchSalaries.push({
                id: demoId("branch-salary", expenseSequence++),
                branchId: branch.id,
                personName: `Demo Staff ${branchIndex + 1}-${String(monthOffset + 1).padStart(2, "0")}`,
                role: ["Clinic Assistant", "Therapy Assistant", "Receptionist"][monthOffset % 3],
                month,
                year,
                salary: 22000 + branchIndex * 1800,
                dateCredited: billDate,
                totalAmount: 22000 + branchIndex * 1800,
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchRents.push({
                id: demoId("branch-rent", expenseSequence++),
                branchId: branch.id,
                month,
                year,
                invoiceId: `DEMO-RENT-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                rentAmount: 65000 + branchIndex * 8500,
                tdsPercentage: 10,
                tdsDeduction: 6500 + branchIndex * 850,
                netAmount: 58500 + branchIndex * 7650,
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchWaterBills.push({
                id: demoId("branch-water", expenseSequence++),
                branchId: branch.id,
                amount: 900 + ((monthOffset * 103 + branchIndex * 75) % 1900),
                billId: `DEMO-WATER-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                paidDate: billDate,
                assignedDate: billDate,
                month,
                year,
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchPowerBills.push({
                id: demoId("branch-power", expenseSequence++),
                branchId: branch.id,
                amount: 3500 + ((monthOffset * 229 + branchIndex * 310) % 6200),
                billId: `DEMO-POWER-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                assignedDate: billDate,
                paidDate: billDate,
                month,
                year,
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchFood.push({
                id: demoId("branch-food", expenseSequence++),
                branchId: branch.id,
                invoiceId: `DEMO-FOOD-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                amount: 3200 + ((monthOffset * 151 + branchIndex * 170) % 4400),
                date: billDate,
                month,
                year,
                totalAmount: 3200 + ((monthOffset * 151 + branchIndex * 170) % 4400),
                createdById: actor.id,
                updatedById: actor.id,
            });

            const taxablePrice = 1800 + ((monthOffset * 81 + branchIndex * 220) % 4200);
            const gstAmount = roundMoney(taxablePrice * 0.18);
            const sgstAmount = roundMoney(gstAmount / 2);
            branchFees.push({
                id: demoId("branch-fee", expenseSequence++),
                branchId: branch.id,
                itemName: "Demo local compliance fee",
                invoiceId: `DEMO-FEE-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                price: taxablePrice,
                date: billDate,
                gst: 9,
                sgst: 9,
                gstAmount,
                sgstAmount,
                year,
                totalAmount: taxablePrice + gstAmount + sgstAmount,
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchInvestments.push({
                id: demoId("branch-investment", expenseSequence++),
                branchId: branch.id,
                itemName: "Demo clinic equipment",
                invoiceId: `DEMO-BINV-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                price: 12000 + ((monthOffset * 340 + branchIndex * 1700) % 28000),
                date: billDate,
                gst: 0,
                sgst: 0,
                gstAmount: 0,
                sgstAmount: 0,
                year,
                totalAmount: 12000 + ((monthOffset * 340 + branchIndex * 1700) % 28000),
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchMisc.push({
                id: demoId("branch-misc", expenseSequence++),
                branchId: branch.id,
                itemName: "Demo branch supplies",
                voucherId: `DEMO-BMISC-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                price: 2400 + ((monthOffset * 73 + branchIndex * 310) % 5200),
                date: billDate,
                gst: 0,
                sgst: 0,
                gstAmount: 0,
                sgstAmount: 0,
                paymentMethod: monthOffset % 2 ? PaymentMethod.CASH : PaymentMethod.ONLINE,
                year,
                totalAmount: 2400 + ((monthOffset * 73 + branchIndex * 310) % 5200),
                createdById: actor.id,
                updatedById: actor.id,
            });
            branchCoreInvestments.push({
                id: demoId("branch-core-investment", expenseSequence++),
                itemName: "Demo branch fit-out",
                invoiceId: `DEMO-BCORE-${branchIndex}-${year}${String(monthIndex + 1).padStart(2, "0")}`,
                price: 9000 + branchIndex * 1400,
                billingDate: billDate,
                paymentDate: billDate,
                gst: 0,
                sgst: 0,
                gstAmount: 0,
                sgstAmount: 0,
                totalAmount: 9000 + branchIndex * 1400,
                belongsTo: ExpenseOwnerType.BRANCH,
                branchId: branch.id,
                createdById: actor.id,
                updatedById: actor.id,
            });
        });

        const corporateDate = dateInMonth(year, monthIndex, monthOffset * 8);
        corporateCoreInvestments.push({
            id: demoId("company-core-investment", monthOffset + 1),
            itemName: "Demo central equipment",
            invoiceId: `DEMO-CCORE-${year}${String(monthIndex + 1).padStart(2, "0")}`,
            price: 90000 + (monthOffset % 5) * 12000,
            billingDate: corporateDate,
            paymentDate: corporateDate,
            gst: 0,
            sgst: 0,
            gstAmount: 0,
            sgstAmount: 0,
            totalAmount: 90000 + (monthOffset % 5) * 12000,
            belongsTo: ExpenseOwnerType.COMPANY,
            branchId: null,
            createdById: actor.id,
            updatedById: actor.id,
        });
        const purchase = 220000 + (monthOffset % 6) * 17500;
        const purchaseTax = roundMoney(purchase * 0.05);
        medicinePurchases.push({
            id: demoId("medicine-purchase", monthOffset + 1),
            invoiceId: `DEMO-MED-${year}${String(monthIndex + 1).padStart(2, "0")}`,
            price: purchase,
            billingDate: corporateDate,
            paymentDate: corporateDate,
            gst: 2.5,
            sgst: 2.5,
            gstAmount: purchaseTax,
            sgstAmount: purchaseTax,
            totalAmount: purchase + purchaseTax * 2,
            createdById: actor.id,
            updatedById: actor.id,
        });
        const marketing = 18000 + (monthOffset % 7) * 3500;
        const marketingTax = roundMoney(marketing * 0.18);
        marketingExpenses.push({
            id: demoId("marketing", monthOffset + 1),
            companyName: "Demo wellness outreach",
            invoiceId: `DEMO-MKT-${year}${String(monthIndex + 1).padStart(2, "0")}`,
            price: marketing,
            billingDate: corporateDate,
            paymentDate: corporateDate,
            gst: 9,
            sgst: 9,
            gstAmount: marketingTax,
            sgstAmount: marketingTax,
            totalAmount: marketing + marketingTax * 2,
            expenseMonth: month,
            expenseYear: year,
            createdById: actor.id,
            updatedById: actor.id,
        });
        const lastMonthIncome = 1_250_000 + (monthOffset % 6) * 85_000;
        csrFunds.push({
            id: demoId("csr", monthOffset + 1),
            month,
            year,
            lastMonthTotalIncome: lastMonthIncome,
            percentage: 1,
            amount: roundMoney(lastMonthIncome * 0.01),
            createdById: actor.id,
            updatedById: actor.id,
        });
        loanRepayments.push({
            id: demoId("loan-repayment", monthOffset + 1),
            loanId: catalogues.loans[monthOffset % catalogues.loans.length].id,
            month,
            year,
            repaymentAmount: 45000 + (monthOffset % 4) * 8000,
            createdById: actor.id,
            updatedById: actor.id,
        });
        advanceTaxes.push({
            id: demoId("advance-tax", monthOffset + 1),
            month,
            year,
            amountPaid: monthIndex % 3 === 0 ? 28000 + monthOffset * 350 : 0,
            createdById: actor.id,
            updatedById: actor.id,
        });
        const otherPrice = 7000 + (monthOffset % 8) * 1300;
        const otherTax = roundMoney(otherPrice * 0.18);
        otherExpenses.push({
            id: demoId("other-expense", monthOffset + 1),
            itemName: "Demo corporate supplies",
            invoiceId: `DEMO-OTHER-${year}${String(monthIndex + 1).padStart(2, "0")}`,
            price: otherPrice,
            billingDate: corporateDate,
            paymentDate: corporateDate,
            gst: 9,
            sgst: 9,
            gstAmount: otherTax,
            sgstAmount: otherTax,
            totalAmount: otherPrice + otherTax * 2,
            year,
            createdById: actor.id,
            updatedById: actor.id,
        });
        directorUsers.forEach((director, directorIndex) => {
            directorSalaries.push({
                id: demoId(
                    "director-salary",
                    monthOffset * directorUsers.length + directorIndex + 1,
                ),
                month,
                year,
                directorUserId: director.id,
                directorNameSnapshot: director.name,
                amount: 85000 + directorIndex * 15000 + (monthOffset % 4) * 2500,
                createdById: actor.id,
                updatedById: actor.id,
            });
        });
        const miscPrice = 12500 + (monthOffset % 5) * 2100;
        const miscTax = roundMoney(miscPrice * 0.18);
        companyMisc.push({
            id: demoId("company-misc", monthOffset + 1),
            itemName: "Demo office and compliance expense",
            voucherId: `DEMO-CMISC-${year}${String(monthIndex + 1).padStart(2, "0")}`,
            price: miscPrice,
            date: corporateDate,
            gst: 9,
            sgst: 9,
            gstAmount: miscTax,
            sgstAmount: miscTax,
            totalAmount: miscPrice + miscTax * 2,
            paymentMethod: monthOffset % 2 ? PaymentMethod.CASH : PaymentMethod.ONLINE,
            createdById: actor.id,
            updatedById: actor.id,
        });
    });

    const chunkSize = 1_000;
    async function insertInChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
        for (let index = 0; index < rows.length; index += chunkSize) {
            await insert(rows.slice(index, index + chunkSize));
        }
    }

    await insertInChunks(sales, (chunk) => prisma.sale.createMany({ data: chunk }));
    await insertInChunks(saleItems, (chunk) => prisma.saleItem.createMany({ data: chunk }));
    await insertInChunks(serviceSales, (chunk) => prisma.serviceSale.createMany({ data: chunk }));
    await insertInChunks(visits, (chunk) => prisma.patientVisit.createMany({ data: chunk }));
    await insertInChunks(feedback, (chunk) => prisma.feedbackEntry.createMany({ data: chunk }));
    await insertInChunks(courseSales, (chunk) => prisma.courseSale.createMany({ data: chunk }));
    await insertInChunks(cardSales, (chunk) => prisma.cardSale.createMany({ data: chunk }));

    await insertInChunks(branchSalaries, (chunk) =>
        prisma.branchSalary.createMany({ data: chunk }),
    );
    await insertInChunks(branchRents, (chunk) => prisma.branchRent.createMany({ data: chunk }));
    await insertInChunks(branchWaterBills, (chunk) =>
        prisma.branchWaterBill.createMany({ data: chunk }),
    );
    await insertInChunks(branchPowerBills, (chunk) =>
        prisma.branchPowerBill.createMany({ data: chunk }),
    );
    await insertInChunks(branchFood, (chunk) =>
        prisma.branchFoodGroceries.createMany({ data: chunk }),
    );
    await insertInChunks(branchFees, (chunk) =>
        prisma.branchGovernmentFee.createMany({ data: chunk }),
    );
    await insertInChunks(branchInvestments, (chunk) =>
        prisma.branchInvestmentPurchase.createMany({ data: chunk }),
    );
    await insertInChunks(branchMisc, (chunk) =>
        prisma.branchMiscellaneousExpense.createMany({ data: chunk }),
    );
    await insertInChunks(branchCoreInvestments, (chunk) =>
        prisma.coreInvestment.createMany({ data: chunk }),
    );

    await insertInChunks(corporateCoreInvestments, (chunk) =>
        prisma.coreInvestment.createMany({ data: chunk }),
    );
    await insertInChunks(medicinePurchases, (chunk) =>
        prisma.medicinePurchase.createMany({ data: chunk }),
    );
    await insertInChunks(marketingExpenses, (chunk) =>
        prisma.marketingExpense.createMany({ data: chunk }),
    );
    await insertInChunks(csrFunds, (chunk) =>
        prisma.csrFund.createMany({ data: chunk, skipDuplicates: true }),
    );
    await insertInChunks(loanRepayments, (chunk) =>
        prisma.loanRepayment.createMany({ data: chunk }),
    );
    await insertInChunks(advanceTaxes, (chunk) => prisma.advanceTax.createMany({ data: chunk }));
    await insertInChunks(otherExpenses, (chunk) => prisma.otherExpense.createMany({ data: chunk }));
    await insertInChunks(directorSalaries, (chunk) =>
        prisma.directorSalary.createMany({ data: chunk }),
    );
    await insertInChunks(companyMisc, (chunk) =>
        prisma.companyMiscellaneousExpense.createMany({ data: chunk }),
    );

    const auditActions = [
        ["SALE_CREATED", "SALE"],
        ["SERVICE_SALE_CREATED", "SERVICE_SALE"],
        ["PATIENT_VISIT_CREATED", "PATIENT_VISIT"],
        ["FEEDBACK_CREATED", "FEEDBACK"],
        ["BRANCH_SALARY_CREATED", "BRANCH_SALARY"],
        ["BRANCH_RENT_CREATED", "BRANCH_RENT"],
        ["COURSE_SALE_CREATED", "COURSE_SALE"],
        ["CARD_SALE_CREATED", "CARD_SALE"],
    ] as const;
    const auditRows = Array.from({ length: 600 }, (_, index) => {
        const [action, resourceType] = auditActions[index % auditActions.length];
        const createdAt = new Date(Date.now() - index * 3 * 60 * 60 * 1000);
        return {
            id: demoId("audit", index + 1),
            userId: actor.id,
            action,
            resourceType,
            resourceId: demoId("resource", index + 1),
            metadata: { demo: true, sequence: index + 1 },
            ipAddress: `192.0.2.${1 + (index % 200)}`,
            userAgent: "SriPAA demo data generator",
            createdAt,
        };
    });
    await insertInChunks(auditRows, (chunk) => prisma.auditLog.createMany({ data: chunk }));

    console.log(
        `Inserted demo data for ${branches.length} branches across ${months.length} months: ` +
            `${sales.length} sales, ${serviceSales.length} service sales, ${visits.length} visit summaries, ` +
            `${feedback.length} feedback entries, ${courseSales.length} course sales, ${cardSales.length} card sales, ` +
            `${branchSalaries.length + branchRents.length + branchWaterBills.length + branchPowerBills.length + branchFood.length + branchFees.length + branchInvestments.length + branchMisc.length + branchCoreInvestments.length} branch expense rows, ` +
            `${corporateCoreInvestments.length + medicinePurchases.length + marketingExpenses.length + csrFunds.length + loanRepayments.length + advanceTaxes.length + otherExpenses.length + directorSalaries.length + companyMisc.length} company expense rows, and ${auditRows.length} audit events.`,
    );
}

main()
    .catch((error) => {
        console.error("Mock data seeding failed.", {
            errorType: error instanceof Error ? error.name : "UnknownError",
        });
        process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
