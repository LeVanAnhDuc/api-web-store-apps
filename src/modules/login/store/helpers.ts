import { LOGIN_LOCKOUT } from "@/modules/login/constants";

export { buildKey } from "@/app/utils/store";

/**
 * Calculate lockout duration based on failed attempt count
 * Login-specific helper - uses LOGIN_LOCKOUT config
 * Pure function - deterministic output for same input
 */
export const calculateLockoutDuration = (attemptCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

  if (attemptCount >= 10) {
    return MAX_LOCKOUT_SECONDS;
  }

  return LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS] || 0;
};
