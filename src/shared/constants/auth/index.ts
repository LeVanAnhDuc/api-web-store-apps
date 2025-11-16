export const AUTH_ROLES = {
  USER: "user",
  ADMIN: "admin"
} as const;

export const EMAIL_VALIDATION = {
  MIN_LENGTH: 3, // Minimum valid email: a@b
  MAX_LENGTH: 254 // RFC 5321 standard
} as const;

/**
 * Basic email format validation regex
 * Validates: localpart@domain.tld structure
 */
export const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Safe email pattern to block dangerous Unicode characters
 * Blocks: control chars, RTL/LTR overrides, zero-width chars, null bytes, etc.
 * Used in addition to format validation for security
 */
export const SAFE_EMAIL_PATTERN =
  // eslint-disable-next-line no-control-regex
  /^[^\u0000-\u001F\u007F-\u009F\u200B-\u200D\u202A-\u202E\uFEFF]+$/;

export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8
} as const;
