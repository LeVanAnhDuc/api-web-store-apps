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
