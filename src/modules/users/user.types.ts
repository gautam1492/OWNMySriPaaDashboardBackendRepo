import type { z } from "zod";
import type { PermissionKey } from "../../constants/permissions.js";
import type { RequestMeta } from "../../types/common.types.js";
import type {
    userBranchesSchema,
    userCreateSchema,
    userListQuery,
    userPatchSchema,
    userRoleSchema,
    userStatusSchema,
    permissionGrantSchema,
} from "./user.validator.js";

export type UserListQuery = z.infer<typeof userListQuery>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserPatchInput = z.infer<typeof userPatchSchema>;
export type UserStatusInput = z.infer<typeof userStatusSchema>;
export type UserRoleInput = z.infer<typeof userRoleSchema>;
export type UserBranchesInput = z.infer<typeof userBranchesSchema>;
export type PermissionGrantInput = z.infer<typeof permissionGrantSchema>;
export type { RequestMeta, PermissionKey };
