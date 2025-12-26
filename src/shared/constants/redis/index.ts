/**
 * Redis key prefixes for different modules
 * Centralized to avoid magic strings and ensure consistency
 *
 * Key Pattern: {module}-{purpose}:{identifier}
 * Example: otp-signup:user@example.com
 */

export const REDIS_KEYS = {
  // Signup module keys
  SIGNUP: {
    OTP: "otp-signup",
    OTP_COOLDOWN: "otp-signup-cooldown",
    OTP_FAILED_ATTEMPTS: "otp-failed-attempts",
    OTP_RESEND_COUNT: "otp-resend-count",
    SESSION: "session-signup"
  },

  // Login module keys
  LOGIN: {
    // Password login
    FAILED_ATTEMPTS: "login-failed-attempts",
    LOCKOUT: "login-lockout",

    // OTP login
    OTP: "otp-login",
    OTP_COOLDOWN: "otp-login-cooldown",
    OTP_FAILED_ATTEMPTS: "otp-login-failed-attempts",
    OTP_RESEND_COUNT: "otp-login-resend-count",

    // Magic link login
    MAGIC_LINK: "magic-link-login",
    MAGIC_LINK_COOLDOWN: "magic-link-login-cooldown",

    // Account unlock
    UNLOCK_TOKEN: "login-unlock-token"
  },

  // Rate limiting keys (sliding window with sorted sets)
  RATE_LIMIT: {
    IP: "rate-limit:ip",
    EMAIL: "rate-limit:email",
    CHECK_EMAIL: "rate-limit:check-email",
    LOGIN_OTP_SEND: "rate-limit:login-otp-send",
    LOGIN_MAGIC_LINK_SEND: "rate-limit:login-magic-link-send"
  }
} as const;
