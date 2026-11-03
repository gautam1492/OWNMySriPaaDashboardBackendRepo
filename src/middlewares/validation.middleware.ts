import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
}

export function validateQuery(schema: ZodType): RequestHandler {
    return (req, _res, next) => {
        try {
            Object.defineProperty(req, "query", {
                value: schema.parse(req.query),
                configurable: true,
                enumerable: true,
                writable: true,
            });
            next();
        } catch (error) {
            next(error);
        }
    };
}
