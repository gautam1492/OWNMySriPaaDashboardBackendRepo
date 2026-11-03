import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { disconnectDatabase, pingDatabase } from "./config/database.js";
import { logger } from "./config/logger.js";
import { processExpiredInvitations } from "./modules/users/invitation.service.js";
import { sendDailyDataReminders } from "./modules/notifications/daily-data-reminder.service.js";
import { safeErrorMetadata } from "./utils/safeError.js";

const server = createServer(app);
const invitationExpiryTimer = setInterval(() => {
    void processExpiredInvitations().catch((error) => {
        logger.error(safeErrorMetadata(error), "Invitation expiry sweep failed");
    });
}, 60_000);
invitationExpiryTimer.unref();
const dailyDataReminderTimer = setInterval(() => {
    void sendDailyDataReminders().catch((error) => {
        logger.error(safeErrorMetadata(error), "Daily data reminder job failed");
    });
}, 60_000);
dailyDataReminderTimer.unref();

async function start() {
    // Fail fast with an actionable message instead of a stack dump on the first
    // request when the database is not reachable.
    try {
        await pingDatabase();
        logger.info("Database connection established");
        void processExpiredInvitations().catch((error) => {
            logger.error(safeErrorMetadata(error), "Initial invitation expiry sweep failed");
        });
        void sendDailyDataReminders().catch((error) => {
            logger.error(safeErrorMetadata(error), "Initial daily data reminder run failed");
        });
    } catch (error) {
        const host = (() => {
            try {
                return new URL(env.DATABASE_URL).host;
            } catch {
                return "the configured DATABASE_URL";
            }
        })();
        logger.error(
            { ...safeErrorMetadata(error), databaseHost: host },
            `Cannot reach the database at ${host}. Start your database server, then run "npm run db:migrate" and "npm run db:seed". The API will keep running; check GET /health/ready.`,
        );
    }

    server.listen(env.PORT, "0.0.0.0", () => {
        logger.info(`SriPAA API listening on port ${env.PORT}`);
    });
}

async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down`);
    clearInterval(invitationExpiryTimer);
    clearInterval(dailyDataReminderTimer);
    server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

void start();
