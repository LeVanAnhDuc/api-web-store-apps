import {
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY
} from "@/constants/time";
import ENV from "@/config/env";

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

// Forgot Password - OTP
export const FORGOT_PASSWORD_OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  COOLDOWN_SECONDS: 60,
  MAX_FAILED_ATTEMPTS: 5,
  MAX_RESEND_ATTEMPTS: 3,
  LOCKOUT_DURATION_MINUTES: 15
} as const;

// Forgot Password - Magic Link
export const FORGOT_PASSWORD_MAGIC_LINK_CONFIG = {
  TOKEN_LENGTH: 64,
  EXPIRY_MINUTES: 15,
  COOLDOWN_SECONDS: 60,
  MAX_RESEND_ATTEMPTS: 3
} as const;

// Forgot Password - Reset Token
export const FORGOT_PASSWORD_RESET_TOKEN_CONFIG = {
  TOKEN_LENGTH: 64,
  EXPIRY_MINUTES: 10
} as const;

// User Profile
export const USER_CONFIG = {
  AVATAR_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  AVATAR_UPLOAD_DIR: "uploads/avatars",
  BASE_URL: ENV.BASE_URL
} as const;

// Blog
export const BLOG_CONFIG = {
  COVER_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  COVER_UPLOAD_DIR: "uploads/blogs"
} as const;

// Contact Admin
export const CONTACT_CONFIG = {
  SUBJECT_MIN_LENGTH: 5,
  SUBJECT_MAX_LENGTH: 200,
  MESSAGE_MIN_LENGTH: 20,
  MESSAGE_MAX_LENGTH: 5000,
  MAX_ATTACHMENTS: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  TICKET_RANDOM_LENGTH: 4,
  TICKET_MAX_RETRIES: 3
} as const;
