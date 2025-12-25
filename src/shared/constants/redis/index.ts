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
    FAILED_ATTEMPTS: "login-failed-attempts",
    LOCKOUT: "login-lockout"
  },

  // Rate limiting keys (sliding window with sorted sets)
  RATE_LIMIT: {
    IP: "rate-limit:ip",
    EMAIL: "rate-limit:email",
    CHECK_EMAIL: "rate-limit:check-email"
  }
} as const;
