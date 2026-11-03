export { HTTP_STATUS } from "./httpStatus.js";
export { MESSAGES } from "./messages.js";
export { ROLES } from "./roles.js";

export const ACCESS_TOKEN_COOKIE = "sripaa_access_token";
export const REFRESH_TOKEN_COOKIE = "sripaa_refresh_token";
export const DEFAULT_TAX_RATE = 2.5;
export const MAX_PAGE_SIZE = 100;
export const BRANCH_SEEDS = [
    { name: "Bengaluru", code: "BLR" },
    { name: "Davangere", code: "DVG" },
    { name: "Shivamogga", code: "SHM" },
    { name: "Yoru", code: "YOR" },
    { name: "Devangri", code: "DEV" },
] as const;
