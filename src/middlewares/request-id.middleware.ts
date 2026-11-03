import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestId(req: Request, res: Response, next: NextFunction) {
    const id = req.header("X-Request-ID") || randomUUID();
    req.id = id;
    res.setHeader("X-Request-ID", id);
    next();
}
