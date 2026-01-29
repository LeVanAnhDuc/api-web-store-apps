import * as bcrypt from "bcrypt";
import { buildKey } from "@/app/utils/store";
import {
  redisGet,
  redisSetEx,
  redisDel,
  redisIncr,
  redisExpire,
  redisExists,
  redisTtl
} from "@/app/utils/store/redis-operations";
import { generateOtp } from "@/app/utils/crypto/otp";
import { REDIS_KEYS } from "@/app/constants/redis";
import { OTP_CONFIG } from "@/modules/signup/constants";

const KEYS = {
  OTP: REDIS_KEYS.SIGNUP.OTP,
  COOLDOWN: REDIS_KEYS.SIGNUP.OTP_COOLDOWN,
  FAILED_ATTEMPTS: REDIS_KEYS.SIGNUP.OTP_FAILED_ATTEMPTS,
  RESEND_COUNT: REDIS_KEYS.SIGNUP.OTP_RESEND_COUNT
};

export const otpStore = {
  createOtp: (): string => generateOtp(OTP_CONFIG.LENGTH),

  checkCooldown: async (email: string): Promise<boolean> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const exists = await redisExists(key);
    return exists === 0;
  },

  setCooldown: async (email: string, seconds: number): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisSetEx(key, seconds, "1");
  },

  clearCooldown: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisDel(key);
  },

  getCooldownRemaining: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const ttl = await redisTtl(key);
    return ttl > 0 ? ttl : 0;
  },

  storeHashed: async (
    email: string,
    otp: string,
    expiry: number
  ): Promise<void> => {
    const key = buildKey(KEYS.OTP, email);
    const hashedOtp = bcrypt.hashSync(otp, OTP_CONFIG.HASH_ROUNDS);
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

    return bcrypt.compareSync(otp, hashedOtp);
  },

  incrementFailedAttempts: async (
    email: string,
    lockoutDurationMinutes: number
  ): Promise<number> => {
    const key = buildKey(KEYS.FAILED_ATTEMPTS, email);
    const count = await redisIncr(key);

    if (count === 1) {
      await redisExpire(key, lockoutDurationMinutes * 60);
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

  isLocked: async (email: string, maxAttempts: number): Promise<boolean> => {
    const attempts = await otpStore.getFailedAttemptCount(email);
    return attempts >= maxAttempts;
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

  hasExceededResendLimit: async (
    email: string,
    maxResends: number
  ): Promise<boolean> => {
    const resendCount = await otpStore.getResendAttemptCount(email);
    return resendCount >= maxResends;
  },

  cleanupOtpData: async (email: string): Promise<void> => {
    await Promise.all([
      otpStore.clearFailedAttempts(email),
      otpStore.clearOtp(email),
      otpStore.clearCooldown(email)
    ]);
  }
};
