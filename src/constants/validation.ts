// Email
export const EMAIL_VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 254
} as const;

export const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SAFE_EMAIL_PATTERN =
  // eslint-disable-next-line no-control-regex
  /^[^\u0000-\u001F\u007F-\u009F\u200B-\u200D\u202A-\u202E\uFEFF]+$/;

// Password
export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128
} as const;

export const PASSWORD_STRENGTH_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

// OTP
export const OTP_VALIDATION = {
  LENGTH: 6
} as const;

export const NUMERIC_OTP_PATTERN = /^\d+$/;

// Full Name
export const FULLNAME_VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100
} as const;

export const SAFE_FULLNAME_PATTERN = /^[\p{L}\s\-'.]+$/u;

// Age
export const AGE_VALIDATION = {
  MIN_AGE: 13,
  MAX_AGE: 120
} as const;

// Address
export const SAFE_ADDRESS_PATTERN = /^[\p{L}\p{N}\s,.\-'/#]+$/u;
