import type { z } from "zod";
import type { directorListQuery } from "./director.validator.js";

export type DirectorListQuery = z.infer<typeof directorListQuery>;
