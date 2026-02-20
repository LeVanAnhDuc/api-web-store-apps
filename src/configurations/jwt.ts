export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "8h",
  REFRESH_TOKEN: "7day",
  NUMBER_ACCESS_TOKEN: 8 * 60 * 60 * 1000,
  NUMBER_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000,
  NUMBER_ID_TOKEN: 8 * 60 * 60 * 1000
} as const;

export const TOKEN_ERRORS = {
  TOKEN_EXPIRED_ERROR: "TokenExpiredError",
  JSON_WEB_TOKEN_ERROR: "JsonWebTokenError"
} as const;
