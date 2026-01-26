export const AUTHENTICATION_ROLES = {
  USER: "user",
  ADMIN: "admin"
} as const;

export const EMAIL_VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 254
} as const;

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
  MIN_LENGTH: 8,
  MAX_LENGTH: 128
} as const;

export const PASSWORD_STRENGTH_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const OTP_VALIDATION = {
  LENGTH: 6
} as const;

export const NUMERIC_OTP_PATTERN = /^\d+$/;
