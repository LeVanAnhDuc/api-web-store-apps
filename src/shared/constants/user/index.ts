export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other"
} as const;

export const FULLNAME_VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100
} as const;

/**
 * Safe pattern for full name validation
 * Only allows: Unicode letters, spaces, hyphens, apostrophes, and periods
 * Blocks: path traversal (/, \), control characters, and other dangerous characters
 */
export const SAFE_FULLNAME_PATTERN = /^[\p{L}\s\-'.]+$/u;
