import "dotenv/config";
import { Prisma, PrismaClient, RoleName, ItemType, ServiceType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BRANCH_SEEDS, ROLES } from "../src/constants/index.js";
import { PERMISSIONS } from "../src/constants/permissions.js";

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
    throw new Error("The demo account seeder is disabled in production.");
}

function requiredDemoPassword(key: string) {
    const password = process.env[key];
    if (!password || password.length < 8) {
        throw new Error(
            `${key} must be set to a password of at least 8 characters to seed demo users.`,
        );
    }
    return password;
}

const TEST_USERS = [
    {
        name: "Super Admin",
        email: "superadmin@sripaa.local",
        password: requiredDemoPassword("SEED_SUPER_ADMIN_PASSWORD"),
        role: ROLES.SUPER_ADMIN,
        branchCodes: [],
    },
    {
        name: "Admin User",
        email: "admin@sripaa.local",
        password: requiredDemoPassword("SEED_ADMIN_PASSWORD"),
        role: ROLES.ADMIN,
        branchCodes: [],
    },
    {
        name: "Director User",
        email: "director@sripaa.local",
        password: requiredDemoPassword("SEED_DIRECTOR_PASSWORD"),
        role: ROLES.DIRECTOR,
        branchCodes: ["BLR", "DVG"],
    },
    {
        name: "Finance User",
        email: "finance@sripaa.local",
        password: requiredDemoPassword("SEED_FINANCE_PASSWORD"),
        role: ROLES.ACCOUNTS_FINANCE,
        branchCodes: ["BLR"],
    },
    {
        name: "Data Entry User",
        email: "dataentry@sripaa.local",
        password: requiredDemoPassword("SEED_DATA_ENTRY_PASSWORD"),
        role: ROLES.DATA_ENTRY,
        branchCodes: ["DVG"],
    },
    {
        name: "Auditor User",
        email: "auditor@sripaa.local",
        password: requiredDemoPassword("SEED_AUDITOR_PASSWORD"),
        role: ROLES.VIEWER_AUDITOR,
        branchCodes: ["BLR", "DVG", "SHM", "YOR", "DEV"],
    },
] as const;

async function main() {
    const roles = new Map<string, { id: string }>();
    for (const name of Object.values(ROLES)) {
        const role = await prisma.role.upsert({
            where: { name: name as RoleName },
            update: {},
            create: { name: name as RoleName },
        });
        roles.set(name, role);
    }

    const permissions = await Promise.all(
        Object.values(PERMISSIONS).map((key) =>
            prisma.permission.upsert({
                where: { key },
                update: { name: key },
                create: { key, name: key },
            }),
        ),
    );

    const branches = new Map<string, { id: string }>();
    for (const branch of BRANCH_SEEDS) {
        const saved = await prisma.branch.upsert({
            where: { code: branch.code },
            update: { name: branch.name, isActive: true },
            create: branch,
        });
        branches.set(branch.code, saved);
    }

    const users = new Map<string, { id: string }>();
    for (const testUser of TEST_USERS) {
        const role = roles.get(testUser.role);
        if (!role) throw new Error(`Missing seeded role: ${testUser.role}`);
        const user = await prisma.user.upsert({
            where: { email: testUser.email },
            update: {
                name: testUser.name,
                passwordHash: await bcrypt.hash(testUser.password, 12),
                roleId: role.id,
                isActive: true,
                isVerified: true,
            },
            create: {
                name: testUser.name,
                email: testUser.email,
                passwordHash: await bcrypt.hash(testUser.password, 12),
                roleId: role.id,
                isActive: true,
                isVerified: true,
            },
        });
        users.set(testUser.role, user);
        await prisma.userBranch.deleteMany({ where: { userId: user.id } });
        const assignedBranches = testUser.branchCodes.map((code) => {
            const branch = branches.get(code);
            if (!branch) throw new Error(`Missing seeded branch: ${code}`);
            return { userId: user.id, branchId: branch.id };
        });
        if (assignedBranches.length) await prisma.userBranch.createMany({ data: assignedBranches });
    }

    const superAdmin = users.get(ROLES.SUPER_ADMIN);
    if (!superAdmin) throw new Error("Missing seeded Super Admin user");
    await prisma.userPermission.deleteMany({ where: { userId: superAdmin.id } });
    await prisma.userPermission.createMany({
        data: permissions.map((permission) => ({
            userId: superAdmin.id,
            permissionId: permission.id,
            grantedById: superAdmin.id,
        })),
    });

    const itemSeeds = [
        { name: "Ashwagandha Tablets", type: ItemType.MEDICINE },
        { name: "Triphala Churna", type: ItemType.MEDICINE },
        { name: "Brahmi Capsules", type: ItemType.MEDICINE },
        { name: "Neem Capsules", type: ItemType.MEDICINE },
        { name: "Ginger Candy", type: ItemType.OTC },
        { name: "Herbal Tea", type: ItemType.OTC },
    ];
    for (const item of itemSeeds) {
        await prisma.item.upsert({
            where: { name_type: { name: item.name, type: item.type } },
            update: { isActive: true },
            create: item,
        });
    }

    const serviceSeeds = [
        { name: "Consultation", type: ServiceType.CONSULTATION },
        { name: "Therapy", type: ServiceType.THERAPY },
    ];
    for (const service of serviceSeeds) {
        await prisma.service.upsert({
            where: { name: service.name },
            update: { type: service.type, isActive: true },
            create: service,
        });
    }

    console.log(
        `Seeded ${roles.size} roles, ${permissions.length} permissions, ${branches.size} branches, ${users.size} test users, ${itemSeeds.length} items, and ${serviceSeeds.length} services.`,
    );
}

main()
    .catch((error) => {
        console.error("Database seed failed.", {
            errorType: error instanceof Error ? error.name : "UnknownError",
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
        });
        process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
