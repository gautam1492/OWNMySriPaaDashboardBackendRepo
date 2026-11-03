import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        exclude: ["node_modules", "dist"],
        env: {
            // HTTP-level tests use a local, non-HTTPS server. Keep cookies usable
            // in that test transport even when the developer .env is production.
            LOG_LEVEL: "silent",
            COOKIE_SECURE: "false",
        },
    },
});
