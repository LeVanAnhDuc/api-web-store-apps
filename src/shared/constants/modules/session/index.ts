// constants
import {
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY
} from "@/shared/constants/time";

/**
 * Login session configuration
 * Based on System Design: Unlimited sessions + auto-cleanup after 30 days
 *
 * Note: Named LOGIN_SESSION_CONFIG to avoid conflict with
 * SESSION_CONFIG in signup module (for signup progress session)
 */
export const LOGIN_SESSION_CONFIG = {
  // Refresh token expiry (7 days in seconds)
  REFRESH_TOKEN_EXPIRY_SECONDS: 7 * SECONDS_PER_DAY,

  // Session inactivity threshold for cleanup (30 days in seconds)
  INACTIVE_THRESHOLD_SECONDS: 30 * SECONDS_PER_DAY,

  // Access token expiry (15 minutes in seconds)
  ACCESS_TOKEN_EXPIRY_SECONDS: 15 * SECONDS_PER_MINUTE,

  // ID token expiry (same as access token)
  ID_TOKEN_EXPIRY_SECONDS: 15 * SECONDS_PER_MINUTE,

  // Warning threshold for too many sessions
  MANY_SESSIONS_WARNING_THRESHOLD: 10
} as const;

/**
 * Login OTP configuration
 * Similar to signup OTP but for login purposes
 */
export const LOGIN_OTP_CONFIG = {
  // OTP length (6 digits)
  LENGTH: 6,

  // OTP expiry time (5 minutes)
  EXPIRY_MINUTES: 5,

  // Cooldown between resend (60 seconds)
  COOLDOWN_SECONDS: 60,

  // Maximum failed OTP attempts before lockout
  MAX_FAILED_ATTEMPTS: 5,

  // Maximum resend attempts per session
  MAX_RESEND_ATTEMPTS: 3,

  // Lockout duration after max failed attempts (15 minutes)
  LOCKOUT_DURATION_MINUTES: 15
} as const;

/**
 * Magic link configuration
 */
export const MAGIC_LINK_CONFIG = {
  // Token length (64 characters hex = 32 bytes)
  TOKEN_LENGTH: 64,

  // Magic link expiry time (15 minutes)
  EXPIRY_MINUTES: 15,

  // Cooldown between resend (60 seconds)
  COOLDOWN_SECONDS: 60,

  // Maximum resend attempts
  MAX_RESEND_ATTEMPTS: 3
} as const;

/**
 * Account unlock configuration
 * When account is locked due to too many failed attempts
 */
export const ACCOUNT_UNLOCK_CONFIG = {
  // Auto unlock wait time (15 minutes)
  AUTO_UNLOCK_MINUTES: 15,

  // Unlock token expiry (24 hours)
  UNLOCK_TOKEN_EXPIRY_HOURS: 24,

  // Unlock token length (64 characters hex)
  UNLOCK_TOKEN_LENGTH: 64
} as const;

/**
 * Login history configuration
 */
export const LOGIN_HISTORY_CONFIG = {
  // History retention period (90 days)
  RETENTION_DAYS: 90,

  // TTL in seconds for MongoDB TTL index
  TTL_SECONDS: 90 * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE
} as const;

/**
 * Device detection configuration
 */
export const DEVICE_CONFIG = {
  // Maximum device name length
  MAX_NAME_LENGTH: 100,

  // Maximum browser name length
  MAX_BROWSER_LENGTH: 50,

  // Maximum OS name length
  MAX_OS_LENGTH: 50,

  // Default values
  DEFAULTS: {
    NAME: "Unknown Device",
    TYPE: "desktop",
    BROWSER: "Unknown",
    OS: "Unknown"
  }
} as const;

/**
 * Device types
 */
export const DEVICE_TYPES = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  TABLET: "tablet",
  OTHER: "other"
} as const;

/**
 * Login methods
 */
export const LOGIN_METHODS = {
  PASSWORD: "password",
  OTP: "otp",
  MAGIC_LINK: "magic-link"
} as const;

/**
 * Login statuses for history
 */
export const LOGIN_STATUSES = {
  SUCCESS: "success",
  FAILED: "failed"
} as const;

/**
 * Login failure reasons
 */
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
