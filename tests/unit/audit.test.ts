import { describe, expect, it } from "vitest";
import { auditListQuery } from "../../src/modules/audit/audit.validator.js";

describe("audit validator", () => {
    it("applies pagination defaults", () => {
        expect(auditListQuery.parse({})).toMatchObject({ page: 1, limit: 20 });
    });
});
