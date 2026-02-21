import {
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY
} from "@/constants/infrastructure";

// Bcrypt
export const BCRYPT = {
  SALT_ROUNDS: 10
} as const;

// Login - Lockout
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

// Login - OTP
export const LOGIN_OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  COOLDOWN_SECONDS: 60,
  MAX_FAILED_ATTEMPTS: 5,
  MAX_RESEND_ATTEMPTS: 3,
  LOCKOUT_DURATION_MINUTES: 15
} as const;

// Login - Magic Link
export const MAGIC_LINK_CONFIG = {
  TOKEN_LENGTH: 64,
  EXPIRY_MINUTES: 15,
  COOLDOWN_SECONDS: 60,
  MAX_RESEND_ATTEMPTS: 3
} as const;

// Login - Account Unlock
export const ACCOUNT_UNLOCK_CONFIG = {
  AUTO_UNLOCK_MINUTES: 15,
  UNLOCK_TOKEN_EXPIRY_HOURS: 24,
  UNLOCK_TOKEN_LENGTH: 64
} as const;

// Login - History
export const LOGIN_HISTORY_CONFIG = {
  RETENTION_DAYS: 90,
  TTL_SECONDS: 90 * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE
} as const;

// Signup - OTP
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  MAX_RESEND_COUNT: 5
} as const;

// Signup - Session
export const SESSION_CONFIG = {
  EXPIRY_MINUTES: 30,
  TOKEN_LENGTH: 32
} as const;

// Rate Limit
export const RATE_LIMIT_CONFIG = {
  LOGIN: {
    PASSWORD: {
      PER_IP: {
        MAX_REQUESTS: 30,
        WINDOW_SECONDS: 900
      }
    },
    OTP: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    },
    MAGIC_LINK: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    }
  },

  SIGNUP: {
    SEND_OTP: {
      PER_IP: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 3,
        WINDOW_SECONDS: 900
      }
    },
    CHECK_EMAIL: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 60
      }
    }
  }
} as const;
