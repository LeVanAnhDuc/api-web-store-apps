// Time
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

export const MILLISECONDS_PER_MINUTE =
  MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
export const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * HOURS_PER_DAY;

export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;

// JWT
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "8h",
  REFRESH_TOKEN: "7day",
  ID_TOKEN: "8h",
  NUMBER_ACCESS_TOKEN: 8 * 60 * 60 * 1000,
  NUMBER_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000
} as const;

export const TOKEN_ERRORS = {
  TOKEN_EXPIRED_ERROR: "TokenExpiredError",
  JSON_WEB_TOKEN_ERROR: "JsonWebTokenError"
} as const;

// MongoDB
/**
 * MongoDB connection states
 * These values correspond to the Mongoose connection readyState values
 */
export const CONNECTION_STATES = {
  /** Connection is not established */
  DISCONNECTED: 0,
  /** Connection is active and ready to use */
  CONNECTED: 1,
  /** Connection is being established */
  CONNECTING: 2,
  /** Connection is being closed */
  DISCONNECTING: 3
} as const;

// HTTP Headers
export const HTTP_HEADERS = {
  USER_AGENT: "user-agent",
  CLIENT_TYPE: "x-client-type",
  X_FORWARDED_FOR: "x-forwarded-for"
} as const;

// Cookie
export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refreshToken"
} as const;

// Redis
export const REDIS_KEYS = {
  SIGNUP: {
    OTP: "otp-signup",
    OTP_COOLDOWN: "otp-signup-cooldown",
    OTP_FAILED_ATTEMPTS: "otp-signup-failed-attempts",
    OTP_RESEND_COUNT: "otp-signup-resend-count",
    SESSION: "session-signup"
  },

  LOGIN: {
    FAILED_ATTEMPTS: "login-failed-attempts",
    LOCKOUT: "login-lockout",
    OTP: "otp-login",
    OTP_COOLDOWN: "otp-login-cooldown",
    OTP_FAILED_ATTEMPTS: "otp-login-failed-attempts",
    OTP_RESEND_COUNT: "otp-login-resend-count",
    MAGIC_LINK: "magic-link-login",
    MAGIC_LINK_COOLDOWN: "magic-link-login-cooldown",
    UNLOCK_TOKEN: "login-unlock-token",
    UNLOCK_RATE: "unlock-rate",
    UNLOCK_COOLDOWN: "unlock-cooldown"
  },

  RATE_LIMIT: {
    LOGIN: {
      IP: "rate-limit:login:ip:",
      EMAIL: "rate-limit:login:email:"
    },
    SIGNUP: {
      IP: "rate-limit:signup:ip:",
      EMAIL: "rate-limit:signup:email:"
    },
    CHECK_EMAIL: {
      IP: "rate-limit:check-email:ip:"
    },
    LOGIN_OTP: {
      IP: "rate-limit:login-otp:ip:",
      EMAIL: "rate-limit:login-otp:email:"
    },
    MAGIC_LINK: {
      IP: "rate-limit:magic-link:ip:",
      EMAIL: "rate-limit:magic-link:email:"
    }
  }
} as const;
