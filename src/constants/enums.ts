// Authentication
export const AUTHENTICATION_ROLES = {
  USER: "user",
  ADMIN: "admin"
} as const;

// User
export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say"
} as const;

// Login
export const LOGIN_METHODS = {
  PASSWORD: "password",
  OTP: "otp",
  MAGIC_LINK: "magic-link"
} as const;

export const LOGIN_STATUSES = {
  SUCCESS: "success",
  FAILED: "failed"
} as const;

export const LOGIN_FAIL_REASONS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_INACTIVE: "account_inactive",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  INVALID_OTP: "invalid_otp",
  OTP_EXPIRED: "otp_expired",
  INVALID_MAGIC_LINK: "invalid_magic_link",
  MAGIC_LINK_EXPIRED: "magic_link_expired",
  RATE_LIMITED: "rate_limited",
  PASSWORDLESS_ACCOUNT: "passwordless_account"
} as const;

// Login History
export const DEVICE_TYPES = {
  DESKTOP: "DESKTOP",
  MOBILE: "MOBILE",
  TABLET: "TABLET",
  UNKNOWN: "UNKNOWN"
} as const;

export const CLIENT_TYPES = {
  WEB: "WEB",
  MOBILE_IOS: "MOBILE_IOS",
  MOBILE_ANDROID: "MOBILE_ANDROID"
} as const;

export const GEO_DEFAULTS = {
  UNKNOWN_COUNTRY: "UNKNOWN",
  UNKNOWN_CITY: "UNKNOWN",
  UNKNOWN_IP: "UNKNOWN"
} as const;

export const USER_AGENT_DEFAULTS = {
  UNKNOWN_DEVICE: "UNKNOWN",
  UNKNOWN_OS: "UNKNOWN",
  UNKNOWN_BROWSER: "UNKNOWN"
} as const;
