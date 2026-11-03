import type { Request } from "express";
import type { RequestMeta } from "../types/common.types.js";

export function getRequestMeta(req: Request): RequestMeta {
    return { ip: req.ip, userAgent: req.get("user-agent") };
}
