import type { z } from "zod";
import type { RequestMeta } from "../../types/common.types.js";
import type { servicePatchSchema, serviceSchema } from "./service.validator.js";

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServicePatchInput = z.infer<typeof servicePatchSchema>;
export type { RequestMeta };
