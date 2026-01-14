import type { MODEL_NAMES } from "@/app/constants/models";

/**
 * Model name type derived from MODEL_NAMES constant
 */
export type ModelName = (typeof MODEL_NAMES)[keyof typeof MODEL_NAMES];
