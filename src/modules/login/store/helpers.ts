import * as crypto from "crypto";
import { LOGIN_LOCKOUT } from "@/modules/login/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";

/**
 * Build Redis key with prefix and identifier
 * Pure function - no side effects
 */
export const buildKey = (prefix: string, identifier: string): string =>
  `${prefix}:${identifier}`;

/**
 * Calculate lockout duration based on failed attempt count
 * Pure function - deterministic output for same input
 */
export const calculateLockoutDuration = (attemptCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

  if (attemptCount >= 10) {
    return MAX_LOCKOUT_SECONDS;
  }

  return LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS] || 0;
};

/**
 * Generate cryptographically secure random token
 * Pure function - uses crypto.randomBytes for security
 *
 * @param length - Length of token in characters (not bytes)
 * @returns Hex string token
 *
 * @example
 * generateSecureToken(64) // Returns 64-char hex string
 */
export const generateSecureToken = (length: number): string =>
  crypto.randomBytes(length / 2).toString("hex");

/**
 * Format duration in seconds to human-readable string
 * Pure function - i18n aware formatting
 *
 * @param seconds - Duration in seconds
 * @param language - Language code (en/vi)
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(45, 'en') // "45 seconds"
 * formatDuration(90, 'en') // "2 minutes"
 * formatDuration(45, 'vi') // "45 giây"
 */
export const formatDuration = (seconds: number, language: string): string => {
  if (seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
    return language === "vi"
      ? `${minutes} phút`
      : `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return language === "vi"
    ? `${seconds} giây`
    : `${seconds} second${seconds > 1 ? "s" : ""}`;
};
