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

/**
 * Hash and store OTP in Redis
 * Uses bcrypt with cost factor 10 for security while maintaining performance
 * @param email - User's email address
 * @param otp - Plain text OTP to hash and store
 * @param expireTime - TTL in seconds
 */
export const createAndStoreOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    // Hash OTP before storing for security
    // If Redis is compromised, OTPs won't be exposed
    const hashedOtp = bcrypt.hashSync(otp, OTP_CONFIG.HASH_ROUNDS);
    await redis.setEx(key, expireTime, hashedOtp);
  } catch (error) {
    Logger.error("Redis OTP creation failed", error);
  }
};

/**
 * Verify OTP against stored hash
 * Uses bcrypt.compare for timing-safe comparison
 * @param email - User's email address
 * @param otp - Plain text OTP to verify
 * @returns true if OTP matches, false otherwise
 */
export const verifyOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    const hashedOtp = await redis.get(key);

    if (!hashedOtp) return false;

    // Use bcrypt.compare for timing-safe comparison
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

/**
 * Increment failed OTP verification attempts for an email
 * @param email - User's email address
 * @param lockoutDurationMinutes - How long to lock the account after max attempts
 * @returns Current number of failed attempts
 */
export const incrementFailedOtpAttempts = async (
  email: string,
  lockoutDurationMinutes: number
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.incr(key);

    if (count === 1) {
      // Set expiry on first failed attempt
      await redis.expire(key, lockoutDurationMinutes * 60);
    }

    return count;
  } catch (error) {
    Logger.error("Redis failed OTP attempts increment failed", error);
    return 0;
  }
};

/**
 * Get number of failed OTP verification attempts for an email
 * @param email - User's email address
 * @returns Number of failed attempts
 */
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

/**
 * Clear failed OTP verification attempts for an email
 * Called after successful OTP verification
 * @param email - User's email address
 */
export const clearFailedOtpAttempts = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_FAILED_ATTEMPTS}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis failed OTP attempts clear failed", error);
  }
};

/**
 * Check if account is locked due to too many failed OTP attempts
 * @param email - User's email address
 * @param maxAttempts - Maximum allowed failed attempts
 * @returns true if account is locked, false otherwise
 */
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

/**
 * Increment OTP resend count for an email
 * Used to track and limit OTP resend requests
 * @param email - User's email address
 * @param windowSeconds - TTL for the resend count window
 * @returns Current resend count
 */
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

/**
 * Get current OTP resend count for an email
 * @param email - User's email address
 * @returns Number of OTP resends in current window
 */
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

/**
 * Clear OTP resend count for an email
 * Called after successful signup completion
 * @param email - User's email address
 */
export const clearResendCount = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_RESEND_COUNT}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis OTP resend count clear failed", error);
  }
};

/**
 * Check if user has exceeded max OTP resend attempts
 * @param email - User's email address
 * @param maxResends - Maximum allowed resends
 * @returns true if limit exceeded, false otherwise
 */
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

/**
 * Consolidated cleanup function for OTP verification data
 * Called after successful OTP verification
 * Clears: OTP, cooldown, and failed attempts
 * @param email - User's email address
 */
export const cleanupOtpData = async (email: string): Promise<void> => {
  await Promise.all([
    clearFailedOtpAttempts(email),
    deleteOtp(email),
    deleteOtpCoolDown(email)
  ]);
};

/**
 * Consolidated cleanup function for signup session
 * Called after signup completion
 * Clears: OTP, session, failed attempts, cooldown, and resend count
 * @param email - User's email address
 */
export const cleanupSignupSession = async (email: string): Promise<void> => {
  await Promise.all([
    deleteOtp(email),
    deleteSession(email),
    clearFailedOtpAttempts(email),
    deleteOtpCoolDown(email),
    clearResendCount(email)
  ]);
};
