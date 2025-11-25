/**
 * Redis key prefixes for different modules
 * Centralized to avoid magic strings and ensure consistency
 */

export const REDIS_KEYS = {
  // Signup module keys
  SIGNUP: {
    OTP: "otp-signup",
    OTP_COOLDOWN: "otp-signup-cooldown",
    OTP_FAILED_ATTEMPTS: "otp-failed-attempts",
    SESSION: "session-signup"
  },

  // Login module keys
  LOGIN: {
    FAILED_ATTEMPTS: "login-failed-attempts",
    LOCKOUT: "login-lockout"
  },

  // Rate limiting keys
  RATE_LIMIT: {
    IP: "rate-limit:ip",
    EMAIL: "rate-limit:email"
  }
} as const;
