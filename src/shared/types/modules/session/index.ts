// constants
import type { LOGIN_METHODS } from "@/shared/constants/modules/session";

/**
 * Login method type derived from LOGIN_METHODS constant
 */
export type LoginMethod = (typeof LOGIN_METHODS)[keyof typeof LOGIN_METHODS];
