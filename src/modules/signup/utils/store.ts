// database
import instanceRedis from "@/database/redis/redis.database";
// utils
import { Logger } from "@/core/utils/logger";

const MILLISECONDS_PER_SECOND = 1000;

const KEY_OTP_SIGNUP = "otp-signup";
const KEY_OTP_COOLDOWN = "otp-signup-cooldown";
const KEY_RATE_LIMIT_IP = "rate-limit:ip";
const KEY_RATE_LIMIT_EMAIL = "rate-limit:email";
const KEY_SESSION_SIGNUP = "session-signup";

export const checkIpRateLimit = async (
  ipAddress: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const currentWindow = Math.floor(
      Date.now() / (windowSeconds * MILLISECONDS_PER_SECOND)
    );
    const key = `${KEY_RATE_LIMIT_IP}:${ipAddress}:${currentWindow}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count <= maxRequests;
  } catch (error) {
    Logger.error("Redis IP rate limit check failed", error);
    return true;
  }
};

export const checkEmailRateLimit = async (
  email: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const currentWindow = Math.floor(
      Date.now() / (windowSeconds * MILLISECONDS_PER_SECOND)
    );
    const key = `${KEY_RATE_LIMIT_EMAIL}:${email}:${currentWindow}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count <= maxRequests;
  } catch (error) {
    Logger.error("Redis email rate limit check failed", error);
    return true;
  }
};

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

export const getOtpCoolDownRemaining = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_COOLDOWN}:${email}`;

    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    Logger.error("Redis OTP cooldown TTL check failed", error);
    return 0;
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

    await redis.setEx(key, expireTime, otp);
  } catch (error) {
    Logger.error("Redis OTP creation failed", error);
  }
};

export const checkOtpExists = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_SIGNUP}:${email}`;

    const exists = await redis.exists(key);

    if (exists === 0) return false;

    const value = await redis.get(key);
    return value === otp;
  } catch (error) {
    Logger.error("Redis OTP exists check failed", error);
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
