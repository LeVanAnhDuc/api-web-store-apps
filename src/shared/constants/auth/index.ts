export const AUTH_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator"
} as const;

export const EMAIL_VALIDATION = {
  MIN_LENGTH: 3, // Minimum valid email: a@b
  MAX_LENGTH: 254 // RFC 5321 standard
} as const;

export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8
} as const;
