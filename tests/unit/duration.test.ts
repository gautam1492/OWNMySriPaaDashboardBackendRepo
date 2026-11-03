import { describe, expect, it } from "vitest";
import { parseDurationMs } from "../../src/utils/duration.js";

describe("duration", () => {
    it("parses JWT-style durations to milliseconds", () => {
        expect(parseDurationMs("15m")).toBe(15 * 60 * 1000);
        expect(parseDurationMs("7d")).toBe(7 * 24 * 60 * 60 * 1000);
        expect(parseDurationMs("1h")).toBe(60 * 60 * 1000);
    });

    it("rejects invalid durations", () => {
        expect(() => parseDurationMs("never")).toThrow();
    });
});
