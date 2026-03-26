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

// Redis
export const REDIS_KEYS = {
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
    },
    FORGOT_PASSWORD: {
      OTP_IP: "rate-limit:forgot-pw-otp:ip:",
      OTP_EMAIL: "rate-limit:forgot-pw-otp:email:",
      MAGIC_LINK_IP: "rate-limit:forgot-pw-ml:ip:",
      MAGIC_LINK_EMAIL: "rate-limit:forgot-pw-ml:email:",
      RESET_IP: "rate-limit:forgot-pw-reset:ip:"
    },
    CONTACT: {
      IP: "rate-limit:contact:ip:"
    },
    USER: {
      UPDATE_IP: "rate-limit:user-update:ip:",
      AVATAR_IP: "rate-limit:user-avatar:ip:"
    }
  }
} as const;
