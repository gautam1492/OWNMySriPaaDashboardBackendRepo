import { beforeEach, describe, expect, it, vi } from "vitest";
import * as branchAccess from "../../src/modules/branches/branch-access.js";
import * as auditService from "../../src/modules/audit/audit.service.js";
import * as itemRepository from "../../src/modules/items/item.repository.js";
import * as saleRepository from "../../src/modules/sales/sale.repository.js";
import * as saleService from "../../src/modules/sales/sale.service.js";
import { saleSchema } from "../../src/modules/sales/sale.validator.js";
import type { AuthUser } from "../../src/types/common.types.js";
import { MESSAGES } from "../../src/constants/messages.js";

vi.mock("../../src/modules/branches/branch-access.js", () => ({ ensureBranchAccess: vi.fn() }));
vi.mock("../../src/modules/audit/audit.service.js", () => ({ writeAudit: vi.fn() }));
vi.mock("../../src/modules/items/item.repository.js", () => ({ findActiveByIds: vi.fn() }));
vi.mock("../../src/modules/sales/sale.repository.js", () => ({
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    replaceItemsAndUpdate: vi.fn(),
    remove: vi.fn(),
}));

const user: AuthUser = {
    id: "entry-user",
    name: "Data Entry",
    email: "entry@example.com",
    roleId: "role-entry",
    role: "DATA_ENTRY",
    branchIds: ["branch-1"],
    permissions: [],
};

const otcItem = { id: "item-1", name: "Ginger Candy", type: "OTC" };
const catalogItems = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
        id: `item-${index + 1}`,
        name: `OTC item ${index + 1}`,
        type: "OTC",
    }));

function saleInput(overrides: Record<string, unknown> = {}) {
    return {
        date: "2026-09-04",
        branchId: "branch-1",
        entryType: "OTC",
        items: [{ itemId: "item-1", unitSold: 2, unitPrice: 500 }],
        gstPercentage: 2.5,
        sgstPercentage: 2.5,
        ...overrides,
    };
}

describe("sale service amount bounds", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(branchAccess.ensureBranchAccess).mockResolvedValue(otcItem as never);
        vi.mocked(itemRepository.findActiveByIds).mockResolvedValue([otcItem] as never);
        vi.mocked(saleRepository.create).mockResolvedValue({ id: "sale-1" } as never);
        vi.mocked(auditService.writeAudit).mockResolvedValue(undefined as never);
    });

    it("creates a sale when calculated amounts fit DECIMAL(12,2)", async () => {
        await expect(saleService.createSale(user, saleInput() as never)).resolves.toMatchObject({
            id: "sale-1",
        });

        expect(saleRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                subtotal: 1000,
                gstAmount: 25,
                sgstAmount: 25,
                totalAmount: 1050,
            }),
        );
    });

    it("rejects an individual line total above the DECIMAL(12,2) limit before persistence", async () => {
        const input = saleInput({
            items: [{ itemId: "item-1", unitSold: 100_000, unitPrice: 100_000 }],
        });
        expect(saleSchema.safeParse(input).success).toBe(true);
        await expect(saleService.createSale(user, input as never)).rejects.toMatchObject({
            statusCode: 422,
            message: MESSAGES.SALE_AMOUNT_OUT_OF_RANGE,
            errors: [expect.objectContaining({ field: "items.0.unitPrice" })],
        });

        expect(saleRepository.create).not.toHaveBeenCalled();
        expect(auditService.writeAudit).not.toHaveBeenCalled();
    });

    it("rejects a subtotal above the database limit even when each line fits", async () => {
        const items = catalogItems(11);
        vi.mocked(itemRepository.findActiveByIds).mockResolvedValue(items as never);
        const input = saleInput({
            items: items.map((item) => ({
                itemId: item.id,
                unitSold: 1,
                unitPrice: 999_999_999.99,
            })),
        });
        expect(saleSchema.safeParse(input).success).toBe(true);

        await expect(saleService.createSale(user, input as never)).rejects.toMatchObject({
            statusCode: 422,
            message: MESSAGES.SALE_AMOUNT_OUT_OF_RANGE,
            errors: [expect.objectContaining({ field: "items" })],
        });

        expect(saleRepository.create).not.toHaveBeenCalled();
    });

    it("rejects a calculated total that exceeds the database limit after tax", async () => {
        const items = catalogItems(6);
        vi.mocked(itemRepository.findActiveByIds).mockResolvedValue(items as never);
        const input = saleInput({
            items: items.map((item) => ({
                itemId: item.id,
                unitSold: 1,
                unitPrice: 999_999_999.99,
            })),
            gstPercentage: 100,
            sgstPercentage: 100,
        });
        expect(saleSchema.safeParse(input).success).toBe(true);

        await expect(saleService.createSale(user, input as never)).rejects.toMatchObject({
            statusCode: 422,
            message: MESSAGES.SALE_AMOUNT_OUT_OF_RANGE,
            errors: [expect.objectContaining({ field: "totalAmount" })],
        });

        expect(saleRepository.create).not.toHaveBeenCalled();
    });
});
