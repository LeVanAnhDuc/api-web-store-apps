/**
 * OTP Configuration for Signup
 * Based on System Design v1.1 specifications
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  MAX_RESEND_COUNT: 5,
  // bcrypt cost factor for OTP hashing (lower than password for performance)
  HASH_ROUNDS: 10
} as const;

/**
 * OTP validation pattern
 * Only allows numeric digits to prevent XSS and injection attacks
 */
export const OTP_PATTERN = /^\d+$/;

/**
 * Signup Session Configuration
 * Random token-based session for tracking signup progress
 */
export const SESSION_CONFIG = {
  EXPIRY_MINUTES: 30,
  TOKEN_LENGTH: 32
} as const;

/**
 * Rate limiting configuration for signup endpoints
 * Implements sliding window algorithm with Redis sorted sets
 */
export const SIGNUP_RATE_LIMITS = {
  SEND_OTP: {
    PER_IP: {
      MAX_REQUESTS: 5,
      WINDOW_SECONDS: 900 // 15 minutes
    },
    PER_EMAIL: {
      MAX_REQUESTS: 3,
      WINDOW_SECONDS: 900 // 15 minutes
    }
  },
  CHECK_EMAIL: {
    PER_IP: {
      MAX_REQUESTS: 10,
      WINDOW_SECONDS: 60 // 1 minute
    }
  }
} as const;
