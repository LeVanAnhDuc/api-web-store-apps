export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  RESEND_COOLDOWN_SECONDS: 60
} as const;

/**
 * OTP validation pattern
 * Only allows numeric digits to prevent XSS and injection attacks
 */
export const OTP_PATTERN = /^\d+$/;

export const SIGNUP_RATE_LIMITS = {
  SEND_OTP: {
    PER_IP: {
      MAX_REQUESTS: 10,
      WINDOW_SECONDS: 900
    },
    PER_EMAIL: {
      MAX_REQUESTS: 2,
      WINDOW_SECONDS: 600
    }
  }
} as const;
