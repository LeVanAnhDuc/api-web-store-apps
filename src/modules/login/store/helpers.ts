import { LOGIN_LOCKOUT } from "@/modules/login/constants";

export const calculateLockoutDuration = (attemptCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

  if (attemptCount >= 10) {
    return MAX_LOCKOUT_SECONDS;
  }

  return LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS] || 0;
};
