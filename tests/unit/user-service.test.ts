import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../../src/config/database.js";
import * as branchService from "../../src/modules/branches/branch.service.js";
import * as userRepository from "../../src/modules/users/user.repository.js";
import * as userService from "../../src/modules/users/user.service.js";
import { writeAudit } from "../../src/modules/audit/audit.service.js";

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn() } }));
vi.mock("../../src/config/database.js", () => ({
    prisma: {
        role: { findUnique: vi.fn() },
        $transaction: vi.fn(),
    },
}));
vi.mock("../../src/modules/branches/branch.service.js", () => ({
    getActiveById: vi.fn(),
}));
vi.mock("../../src/modules/users/user.repository.js", () => ({
    findRoles: vi.fn(),
    list: vi.fn(),
    findByIdWithRelations: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setBranches: vi.fn(),
    setPermissions: vi.fn(),
}));
vi.mock("../../src/modules/audit/audit.service.js", () => ({ writeAudit: vi.fn() }));

const actor = {
    id: "super-admin-id",
    role: { id: "super-admin-role", name: "SUPER_ADMIN" },
    branches: [],
    permissions: [],
};

const tx = {
    user: { create: vi.fn(), update: vi.fn() },
    userBranch: { createMany: vi.fn(), deleteMany: vi.fn() },
};

describe("user service branch assignments", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(userRepository.findByIdWithRelations).mockResolvedValue(actor as never);
        vi.mocked(branchService.getActiveById).mockResolvedValue({
            id: "branch-1",
            isActive: true,
        } as never);
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
        vi.mocked(writeAudit).mockResolvedValue(undefined as never);
        vi.mocked(prisma.role.findUnique).mockResolvedValue({ name: "DATA_ENTRY" } as never);
        (prisma.$transaction as any).mockImplementation(
            async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
        );
        tx.user.create.mockResolvedValue({
            id: "created-user-id",
            name: "Data Entry User",
            email: "entry@example.com",
            role: { id: "data-entry-role", name: "DATA_ENTRY" },
        });
        tx.userBranch.createMany.mockResolvedValue({ count: 1 });
        tx.userBranch.deleteMany.mockResolvedValue({ count: 1 });
    });

    it.each([
        { label: "omitted", branchIds: undefined },
        { label: "empty", branchIds: [] },
    ])("rejects branch-scoped user creation with $label branchIds", async ({ branchIds }) => {
        await expect(
            userService.create("super-admin-id", {
                name: "Data Entry User",
                email: "entry@example.com",
                password: "password123",
                roleId: "data-entry-role",
                ...(branchIds === undefined ? {} : { branchIds }),
            } as never),
        ).rejects.toMatchObject({
            statusCode: 422,
            errors: [expect.objectContaining({ field: "branchIds" })],
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(branchService.getActiveById).not.toHaveBeenCalled();
    });

    it("creates a branch-scoped user and writes branchIds to UserBranch rows", async () => {
        await userService.create("super-admin-id", {
            name: "Data Entry User",
            email: "ENTRY@example.com",
            password: "password123",
            roleId: "data-entry-role",
            branchIds: ["branch-1"],
            mobileNumber: "9876543210",
        } as never);

        expect(branchService.getActiveById).toHaveBeenCalledWith("branch-1");
        expect(tx.user.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                name: "Data Entry User",
                email: "entry@example.com",
                roleId: "data-entry-role",
                mobileNumber: "9876543210",
                passwordHash: "hashed-password",
            }),
            include: { role: true },
        });
        expect(tx.user.create.mock.calls[0]?.[0]).not.toHaveProperty("data.branchIds");
        expect(tx.userBranch.createMany).toHaveBeenCalledWith({
            data: [{ userId: "created-user-id", branchId: "branch-1" }],
        });
    });

    it("requires explicit branch assignments when creating a director", async () => {
        vi.mocked(prisma.role.findUnique).mockResolvedValue({ name: "DIRECTOR" } as never);
        tx.user.create.mockResolvedValue({
            id: "director-id",
            name: "Director",
            email: "director@example.com",
            role: { id: "director-role", name: "DIRECTOR" },
        });

        await expect(
            userService.create("super-admin-id", {
                name: "Director",
                email: "director@example.com",
                password: "password123",
                roleId: "director-role",
                branchIds: ["branch-1"],
            } as never),
        ).resolves.toMatchObject({ id: "director-id" });
        expect(tx.userBranch.createMany).toHaveBeenCalledWith({
            data: [{ userId: "director-id", branchId: "branch-1" }],
        });
    });

    it("updates branch assignments through UserBranch instead of a User.branchIds field", async () => {
        vi.mocked(userRepository.findByIdWithRelations)
            .mockResolvedValueOnce(actor as never)
            .mockResolvedValueOnce({
                id: "target-user-id",
                role: { id: "data-entry-role", name: "DATA_ENTRY" },
            } as never);
        tx.user.update.mockResolvedValue({
            id: "target-user-id",
            name: "Data Entry User",
            email: "entry@example.com",
            role: { id: "data-entry-role", name: "DATA_ENTRY" },
        });

        await userService.update("super-admin-id", "target-user-id", {
            branchIds: ["branch-1"],
        } as never);

        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: "target-user-id" },
            data: {},
            include: { role: true },
        });
        expect(tx.userBranch.deleteMany).toHaveBeenCalledWith({
            where: { userId: "target-user-id" },
        });
        expect(tx.userBranch.createMany).toHaveBeenCalledWith({
            data: [{ userId: "target-user-id", branchId: "branch-1" }],
        });
    });

    it("returns branch IDs and branch details in the paginated user list without password hashes", async () => {
        vi.mocked(userRepository.list).mockResolvedValue({
            items: [
                {
                    id: "user-1",
                    name: "Branch User",
                    email: "branch@example.com",
                    passwordHash: "must-not-leak",
                    role: { id: "role-1", name: "DATA_ENTRY" },
                    branches: [
                        {
                            branchId: "branch-1",
                            branch: { id: "branch-1", name: "Central", code: "CTR" },
                        },
                    ],
                },
            ],
            total: 1,
        } as never);

        const result = await userService.list("super-admin-id", {
            page: 1,
            limit: 20,
            search: "branch",
        });

        expect(result.items[0]).toMatchObject({
            id: "user-1",
            branchIds: ["branch-1"],
            branches: [{ id: "branch-1", name: "Central", code: "CTR" }],
        });
        expect(result.items[0]).not.toHaveProperty("passwordHash");
    });
});
