import type { z } from "zod";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { serviceSaleListQuery, serviceSaleSchema } from "./service-sale.validator.js";

export type ServiceSaleListQuery = z.infer<typeof serviceSaleListQuery>;
export type ServiceSaleInput = z.infer<typeof serviceSaleSchema>;
export type { AuthUser, RequestMeta };
