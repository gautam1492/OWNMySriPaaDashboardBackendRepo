import { describe, expect, it } from "vitest";
import { resolveCookieSecure } from "../../src/config/cookie-security.js";

describe("cookie secure configuration", () => {
    it("defaults cookies to Secure in production", () => {
        expect(resolveCookieSecure("production", undefined)).toBe(true);
    });

    it("keeps local HTTP development usable by default", () => {
        expect(resolveCookieSecure("development", undefined)).toBe(false);
    });

    it("honors an explicit secure setting outside production", () => {
        expect(resolveCookieSecure("development", "true")).toBe(true);
        expect(resolveCookieSecure("test", "false")).toBe(false);
    });
});
