/**
 * Security configuration constants
 */

/**
 * Bcrypt hashing configuration
 */
export const BCRYPT = {
  /** Number of salt rounds for bcrypt hashing (higher = more secure but slower) */
  SALT_ROUNDS: 10
} as const;
