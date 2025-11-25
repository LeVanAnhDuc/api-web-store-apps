/**
 * Login rate limits configuration
 * IP-based rate limiting to prevent distributed brute force attacks
 * Per-email protection is handled by LOGIN_LOCKOUT (progressive blocking)
 *
 * Note: IP limit is higher than per-email because:
 * - Multiple users may share same IP (office, public WiFi, NAT)
 * - Progressive lockout already protects individual accounts
 * - This only catches extreme distributed attacks
 */
export const LOGIN_RATE_LIMITS = {
  PER_IP: {
    MAX_REQUESTS: 30,
    WINDOW_SECONDS: 900 // 15 minutes
  }
} as const;

/**
 * Progressive login lockout configuration
 * Implements exponential backoff for failed login attempts
 */
export const LOGIN_LOCKOUT = {
  // Failed attempts before lockout starts
  FREE_ATTEMPTS: 4,

  // Lockout durations in seconds for each attempt level
  LOCKOUT_DURATIONS: {
    5: 30, // 30 seconds
    6: 60, // 1 minute
    7: 120, // 2 minutes
    8: 240, // 4 minutes
    9: 480, // 8 minutes
    10: 1800 // 30 minutes (max lockout)
  } as const,

  // Maximum lockout duration (30 minutes)
  MAX_LOCKOUT_SECONDS: 1800,

  // Time window for attempt counter reset (30 minutes)
  RESET_WINDOW_SECONDS: 1800
} as const;
