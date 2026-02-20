import {
  redisGet,
  redisSetEx,
  redisDel,
  redisIncr,
  redisExpire,
  redisTtl,
  redisExists
} from "@/app/utils/store/redis-operations";
import { generateOtp } from "@/app/utils/crypto/otp";
import { REDIS_KEYS } from "@/constants/redis";
import { LOGIN_OTP_CONFIG } from "@/modules/login/constants";
import { buildKey } from "@/app/utils/store";
import { hashValue, isValidHashedValue } from "@/app/utils/crypto/bcrypt";

const KEYS = {
  OTP: REDIS_KEYS.LOGIN.OTP,
  COOLDOWN: REDIS_KEYS.LOGIN.OTP_COOLDOWN,
  FAILED_ATTEMPTS: REDIS_KEYS.LOGIN.OTP_FAILED_ATTEMPTS,
  RESEND_COUNT: REDIS_KEYS.LOGIN.OTP_RESEND_COUNT
};

export const otpStore = {
  createOtp: (): string => generateOtp(LOGIN_OTP_CONFIG.LENGTH),

  checkCooldown: async (email: string): Promise<boolean> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const exists = await redisExists(key);
    return exists === 0;
  },

  getCooldownRemaining: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const ttl = await redisTtl(key);
    return ttl > 0 ? ttl : 0;
  },

  setCooldown: async (email: string, seconds: number): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisSetEx(key, seconds, "1");
  },

  clearCooldown: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisDel(key);
  },

  storeHashed: async (
    email: string,
    otp: string,
    expiry: number
  ): Promise<void> => {
    const key = buildKey(KEYS.OTP, email);
    const hashedOtp = hashValue(otp);
    await redisSetEx(key, expiry, hashedOtp);
  },

  clearOtp: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.OTP, email);
    await redisDel(key);
  },

  verify: async (email: string, otp: string): Promise<boolean> => {
    const key = buildKey(KEYS.OTP, email);
    const hashedOtp = await redisGet(key);

    if (!hashedOtp) return false;

    return isValidHashedValue(otp, hashedOtp);
  },

  incrementFailedAttempts: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.FAILED_ATTEMPTS, email);
    const count = await redisIncr(key);

    if (count === 1) {
      await redisExpire(key, LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES * 60);
    }

    return count;
  },

  getFailedAttemptCount: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.FAILED_ATTEMPTS, email);
    const count = await redisGet(key);
    return count ? parseInt(count, 10) : 0;
  },

  clearFailedAttempts: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.FAILED_ATTEMPTS, email);
    await redisDel(key);
  },

  isLocked: async (email: string): Promise<boolean> => {
    const attempts = await otpStore.getFailedAttemptCount(email);
    return attempts >= LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS;
  },

  incrementResendCount: async (
    email: string,
    windowSeconds: number
  ): Promise<number> => {
    const key = buildKey(KEYS.RESEND_COUNT, email);
    const count = await redisIncr(key);

    if (count === 1) {
      await redisExpire(key, windowSeconds);
    }

    return count;
  },

  getResendAttemptCount: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.RESEND_COUNT, email);
    const count = await redisGet(key);
    return count ? parseInt(count, 10) : 0;
  },

  clearResendCount: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.RESEND_COUNT, email);
    await redisDel(key);
  },

  hasExceededResendLimit: async (email: string): Promise<boolean> => {
    const resendCount = await otpStore.getResendAttemptCount(email);
    return resendCount >= LOGIN_OTP_CONFIG.MAX_RESEND_ATTEMPTS;
  },

  cleanupAll: async (email: string): Promise<void> => {
    await Promise.all([
      otpStore.clearOtp(email),
      otpStore.clearCooldown(email),
      otpStore.clearFailedAttempts(email),
      otpStore.clearResendCount(email)
    ]);
  }
};
