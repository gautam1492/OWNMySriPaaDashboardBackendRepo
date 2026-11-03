import type { z } from "zod";
import type { createBranchSchema } from "./branch.validator.js";

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
