import * as bcrypt from "bcrypt";
import instanceRedis from "@/database/redis/redis.database";
import { Logger } from "@/infra/utils/logger";
import { REDIS_KEYS } from "@/app/constants/redis";
import { OTP_CONFIG } from "@/modules/signup/constants";

const { SIGNUP } = REDIS_KEYS;
const KEY_OTP_SIGNUP = SIGNUP.OTP;
const KEY_OTP_COOLDOWN = SIGNUP.OTP_COOLDOWN;
const KEY_OTP_FAILED_ATTEMPTS = SIGNUP.OTP_FAILED_ATTEMPTS;
const KEY_OTP_RESEND_COUNT = SIGNUP.OTP_RESEND_COUNT;
const KEY_SESSION_SIGNUP = SIGNUP.SESSION;

export const checkOtpCoolDown = async (email: string): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_COOLDOWN}:${email}`;

    const exists = await redis.exists(key);
    return exists === 0;
  } catch (error) {
    Logger.error("Redis OTP cooldown check failed", error);
    return true;
  }
};

export const setOtpCoolDown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_COOLDOWN}:${email}`;

    await redis.setEx(key, cooldownSeconds, "1");
  } catch (error) {
    Logger.error("Redis OTP cooldown set failed", error);
  }
};

export const deleteOtpCoolDown = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_COOLDOWN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis OTP cooldown deletion failed", error);
  }
};

export const deleteOtp = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis OTP deletion failed", error);
  }
};

export const createAndStoreOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    const hashedOtp = bcrypt.hashSync(otp, OTP_CONFIG.HASH_ROUNDS);
    await redis.setEx(key, expireTime, hashedOtp);
  } catch (error) {
    Logger.error("Redis OTP creation failed", error);
  }
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    const hashedOtp = await redis.get(key);

    if (!hashedOtp) return false;

    return bcrypt.compareSync(otp, hashedOtp);
  } catch (error) {
    Logger.error("Redis OTP verification failed", error);
    return false;
  }
};

export const storeSession = async (
  email: string,
  sessionId: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_SESSION_SIGNUP}:${email}`;

    await redis.setEx(key, expireTime, sessionId);
  } catch (error) {
    Logger.error("Redis session storage failed", error);
  }
};

export const verifySession = async (
  email: string,
  sessionId: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_SESSION_SIGNUP}:${email}`;

    const storedSessionId = await redis.get(key);
    return storedSessionId === sessionId;
  } catch (error) {
    Logger.error("Redis session verification failed", error);
    return false;
  }
};

export const deleteSession = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_SESSION_SIGNUP}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis session deletion failed", error);
  }
};

export const incrementFailedOtpAttempts = async (
  email: string,
  lockoutDurationMinutes: number
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, lockoutDurationMinutes * 60);
    }

    return count;
  } catch (error) {
    Logger.error("Redis failed OTP attempts increment failed", error);
    return 0;
  }
};

export const getFailedOtpAttempts = async (email: string): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    Logger.error("Redis failed OTP attempts check failed", error);
    return 0;
  }
};

export const clearFailedOtpAttempts = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_FAILED_ATTEMPTS}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis failed OTP attempts clear failed", error);
  }
};
export const isOtpAccountLocked = async (
  email: string,
  maxAttempts: number
): Promise<boolean> => {
  try {
    const failedAttempts = await getFailedOtpAttempts(email);
    return failedAttempts >= maxAttempts;
  } catch (error) {
    Logger.error("Redis OTP account lock check failed", error);
    return false;
  }
};

export const incrementResendCount = async (
  email: string,
  windowSeconds: number
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_RESEND_COUNT}:${email}`;

    const count = await redis.incr(key);

    if (count === 1) {
      // Set expiry on first resend
      await redis.expire(key, windowSeconds);
    }

    return count;
  } catch (error) {
    Logger.error("Redis OTP resend count increment failed", error);
    return 0;
  }
};

export const getResendCount = async (email: string): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_RESEND_COUNT}:${email}`;

    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    Logger.error("Redis OTP resend count check failed", error);
    return 0;
  }
};

export const clearResendCount = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_RESEND_COUNT}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis OTP resend count clear failed", error);
  }
};

export const hasExceededResendLimit = async (
  email: string,
  maxResends: number
): Promise<boolean> => {
  try {
    const resendCount = await getResendCount(email);
    return resendCount >= maxResends;
  } catch (error) {
    Logger.error("Redis OTP resend limit check failed", error);
    return false;
  }
};

export const cleanupOtpData = async (email: string): Promise<void> => {
  await Promise.all([
    clearFailedOtpAttempts(email),
    deleteOtp(email),
    deleteOtpCoolDown(email)
  ]);
};

export const cleanupSignupSession = async (email: string): Promise<void> => {
  await Promise.all([
    deleteOtp(email),
    deleteSession(email),
    clearFailedOtpAttempts(email),
    deleteOtpCoolDown(email),
    clearResendCount(email)
  ]);
};
