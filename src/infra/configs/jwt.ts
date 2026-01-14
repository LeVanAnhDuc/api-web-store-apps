/**
 * JWT token expiry times configuration
 */
export const TOKEN_EXPIRY = {
  /** Access token expiry time in string format (for JWT) */
  ACCESS_TOKEN: "8h",
  /** Refresh token expiry time in string format (for JWT) */
  REFRESH_TOKEN: "7day",
  /** Reset password token expiry time in string format (for JWT) */
  RESET_PASS_TOKEN: "15m",
  /** Access token expiry time in milliseconds */
  NUMBER_ACCESS_TOKEN: 8 * 60 * 60 * 1000, // 28,800,000ms (8 hours)
  /** Refresh token expiry time in milliseconds */
  NUMBER_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 604,800,000ms (7 days)
  /** Reset password token expiry time in milliseconds */
  NUMBER_RESET_PASS_TOKEN: 15 * 60 * 1000 // 900,000ms (15 minutes)
} as const;

/**
 * JWT error types
 */
export const TOKEN_ERRORS = {
  TOKEN_EXPIRED_ERROR: "TokenExpiredError",
  JSON_WEB_TOKEN_ERROR: "JsonWebTokenError"
} as const;
