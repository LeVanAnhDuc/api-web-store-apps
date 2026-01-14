import {
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY
} from "@/app/constants/time";

/**
 * Login rate limits configuration
 * IP-based rate limiting to prevent distributed brute force attacks
 * Per-email protection is handled by LOGIN_LOCKOUT (progressive blocking)
 *
 * Note: IP limit is higher than per-email because:
 * - Multiple users may share same IP (office, public WiFi, NAT)
 * - Progressive lockout already protects individual accounts
 * - This only catches extreme distributed attacks
 */
export const LOGIN_RATE_LIMITS = {
  PER_IP: {
    MAX_REQUESTS: 30,
    WINDOW_SECONDS: 900
  }
} as const;

export const LOGIN_OTP_RATE_LIMITS = {
  PER_IP: {
    MAX_REQUESTS: 10,
    WINDOW_SECONDS: 900
  },
  PER_EMAIL: {
    MAX_REQUESTS: 5,
    WINDOW_SECONDS: 900
  }
} as const;

export const MAGIC_LINK_RATE_LIMITS = {
  PER_IP: {
    MAX_REQUESTS: 10,
    WINDOW_SECONDS: 900
  },
  PER_EMAIL: {
    MAX_REQUESTS: 5,
    WINDOW_SECONDS: 900
  }
} as const;

/**
 * Progressive login lockout configuration
 * Implements exponential backoff for failed login attempts
 */
export const LOGIN_LOCKOUT = {
  FREE_ATTEMPTS: 4,

  LOCKOUT_DURATIONS: {
    5: 30,
    6: 60,
    7: 120,
    8: 240,
    9: 480,
    10: 1800
  } as const,

  MAX_LOCKOUT_SECONDS: 1800,
  RESET_WINDOW_SECONDS: 1800
} as const;

/**
 * Token configuration
 * Note: Actual expiry values are in infra/configs/jwt.ts
 * These are reference values for documentation
 */
export const TOKEN_CONFIG = {
  REFRESH_TOKEN_EXPIRY_SECONDS: 7 * SECONDS_PER_DAY,
  ACCESS_TOKEN_EXPIRY_SECONDS: 15 * SECONDS_PER_MINUTE,
  ID_TOKEN_EXPIRY_SECONDS: 15 * SECONDS_PER_MINUTE
} as const;

export const LOGIN_OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  COOLDOWN_SECONDS: 60,
  MAX_FAILED_ATTEMPTS: 5,
  MAX_RESEND_ATTEMPTS: 3,
  LOCKOUT_DURATION_MINUTES: 15
} as const;

export const MAGIC_LINK_CONFIG = {
  TOKEN_LENGTH: 64,
  EXPIRY_MINUTES: 15,
  COOLDOWN_SECONDS: 60,
  MAX_RESEND_ATTEMPTS: 3
} as const;

export const ACCOUNT_UNLOCK_CONFIG = {
  AUTO_UNLOCK_MINUTES: 15,
  UNLOCK_TOKEN_EXPIRY_HOURS: 24,
  UNLOCK_TOKEN_LENGTH: 64
} as const;

export const LOGIN_HISTORY_CONFIG = {
  RETENTION_DAYS: 90,
  TTL_SECONDS: 90 * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE
} as const;

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
