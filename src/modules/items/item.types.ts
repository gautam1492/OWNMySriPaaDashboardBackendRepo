import type { z } from "zod";
import type { RequestMeta } from "../../types/common.types.js";
import type {
    itemImportSchema,
    itemListQuery,
    itemPatchSchema,
    itemSchema,
} from "./item.validator.js";

export type ItemListQuery = z.infer<typeof itemListQuery>;
export type ItemInput = z.infer<typeof itemSchema>;
export type ItemPatchInput = z.infer<typeof itemPatchSchema>;
export type ItemImportInput = z.infer<typeof itemImportSchema>;
export type { RequestMeta };
