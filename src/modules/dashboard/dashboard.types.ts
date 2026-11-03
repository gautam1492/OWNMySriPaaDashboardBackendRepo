import type { z } from "zod";
import type { AuthUser } from "../../types/common.types.js";
import type { periodQuery } from "./dashboard.validator.js";

export type PeriodQuery = z.infer<typeof periodQuery>;
export type { AuthUser };
