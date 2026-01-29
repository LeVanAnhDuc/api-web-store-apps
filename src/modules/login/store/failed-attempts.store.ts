import { buildKey, calculateLockoutDuration } from "./helpers";
import {
  redisGet,
  redisSetEx,
  redisDel,
  redisIncr,
  redisExpire,
  redisTtl
} from "@/app/utils/store/redis-operations";
import { REDIS_KEYS } from "@/app/constants/redis";
import { LOGIN_LOCKOUT } from "@/modules/login/constants";

const KEYS = {
  FAILED_ATTEMPTS: REDIS_KEYS.LOGIN.FAILED_ATTEMPTS,
  LOCKOUT: REDIS_KEYS.LOGIN.LOCKOUT
};

export const failedAttemptsStore = {
  getCount: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.FAILED_ATTEMPTS, email);
    const count = await redisGet(key);
    return count ? parseInt(count, 10) : 0;
  },

  trackAttempt: async (
    email: string
  ): Promise<{ attemptCount: number; lockoutSeconds: number }> => {
    const attemptsKey = buildKey(KEYS.FAILED_ATTEMPTS, email);
    const lockoutKey = buildKey(KEYS.LOCKOUT, email);

    const attemptCount = await redisIncr(attemptsKey);

    if (attemptCount === 1) {
      await redisExpire(attemptsKey, LOGIN_LOCKOUT.RESET_WINDOW_SECONDS);
    }

    const lockoutSeconds = calculateLockoutDuration(attemptCount);

    if (lockoutSeconds > 0) {
      await redisSetEx(lockoutKey, lockoutSeconds, attemptCount.toString());
    }

    return { attemptCount, lockoutSeconds };
  },

  resetAll: async (email: string): Promise<void> => {
    await Promise.all([
      redisDel(buildKey(KEYS.FAILED_ATTEMPTS, email)),
      redisDel(buildKey(KEYS.LOCKOUT, email))
    ]);
  },

  checkLockout: async (
    email: string
  ): Promise<{ isLocked: boolean; remainingSeconds: number }> => {
    const key = buildKey(KEYS.LOCKOUT, email);
    const ttl = await redisTtl(key);

    if (ttl > 0) {
      return { isLocked: true, remainingSeconds: ttl };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }
};
