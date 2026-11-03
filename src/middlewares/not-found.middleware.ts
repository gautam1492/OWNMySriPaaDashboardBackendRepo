import type { RequestHandler } from "express";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound: RequestHandler = (_req, _res, next) =>
    next(new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.ROUTE_NOT_FOUND));
