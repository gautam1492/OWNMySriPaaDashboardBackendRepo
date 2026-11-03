import type { z } from "zod";
import type { EntryType, ItemType } from "@prisma/client";
import type { AuthUser, RequestMeta } from "../../types/common.types.js";
import type { saleListQuery, saleSchema } from "./sale.validator.js";

export type SaleListQuery = z.infer<typeof saleListQuery> & { entryType?: EntryType };
export type SaleInput = z.infer<typeof saleSchema>;
export type SaleItemPayload = { itemId: string; unitSold: number; unitPrice: number };
export type { AuthUser, RequestMeta, EntryType, ItemType };
