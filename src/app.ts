
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { corsOrigins, env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { pingDatabase } from "./config/database.js";
import { HTTP_STATUS } from "./constants/httpStatus.js";
import { MESSAGES } from "./constants/messages.js";
import router from "./routes/index.js";
import { requestId } from "./middlewares/request-id.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/not-found.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import { safeErrorMetadata } from "./utils/safeError.js";

export const app = express();

// Trust only the configured number of proxy hops so req.ip (and rate limits)
// use the client address supplied by the hosting proxy.
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));

const allowedOrigins = new Set(corsOrigins);

app.use((req, _res, next) => {
    const origin = req.get("origin");
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

    if (isMutation && origin && !allowedOrigins.has(origin)) {
        return next(new ApiError(HTTP_STATUS.FORBIDDEN, "Request origin is not allowed."));
    }

    next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(requestId);

app.use(
    pinoHttp({
        logger,
        genReqId: (req) => req.id,
        customLogLevel: (req, res, err) => {
            if (err) return "error";
            if (res.statusCode >= 400) return "warn";
            return "silent";
        },
        serializers: {
            req: (req) => ({
                method: req.method,
                url: String(req.url ?? "/")
                    .split("?", 1)[0]
                    .replace(/(\/(?:user-)?invitations\/)[^/]+/gi, "$1[redacted]"),
                headers: {
                    origin: req.headers.origin,
                    "user-agent": req.headers["user-agent"],
                    "content-type": req.headers["content-type"],
                },
            }),
            res: (res) => ({
                statusCode: res.statusCode,
                headers: {
                    ...(typeof res.getHeaders === "function" ? res.getHeaders() : {}),
                    "set-cookie": undefined,
                },
            }),
        },
    }),
);

app.use(
    "/api/v1/auth",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: "draft-8",
        legacyHeaders: false,
    }),
);

// Liveness: the process is up. Never touches the database.
app.get("/health", (_req, res) => res.json({ success: true, status: "healthy" }));

// Readiness: dependencies (database) are usable. Returns 503 when they are not.
app.get("/health/ready", async (_req, res) => {
    try {
        await pingDatabase();
        return res.json({ success: true, status: "ready", database: "up" });
    } catch (error) {
        logger.error(safeErrorMetadata(error), "Readiness check failed: database unreachable");

        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
            success: false,
            status: "degraded",
            database: "down",
            message: MESSAGES.DATABASE_UNAVAILABLE,
        });
    }
});

app.use("/api/v1", router);

app.use(notFound);
app.use(errorHandler);
