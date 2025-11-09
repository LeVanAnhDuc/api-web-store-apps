// database
import instanceRedis from "@/database/redis/redis.database";
// utils
import { Logger } from "@/core/utils/logger";

const MILLISECONDS_PER_SECOND = 1000;

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
    const key = `rate_limit:ip:${ipAddress}:${currentWindow}`;

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
    const key = `rate_limit:email:${email}:${currentWindow}`;

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

export const checkOtpCooldown = async (email: string): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `otp_cooldown:${email}`;

    const exists = await redis.exists(key);
    return exists === 0;
  } catch (error) {
    Logger.error("Redis OTP cooldown check failed", error);
    return true;
  }
};

export const setOtpCooldown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `otp_cooldown:${email}`;

    await redis.setEx(key, cooldownSeconds, "1");
  } catch (error) {
    Logger.error("Redis OTP cooldown set failed", error);
  }
};

export const getOtpCooldownRemaining = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `otp_cooldown:${email}`;

    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    Logger.error("Redis OTP cooldown TTL check failed", error);
    return 0;
  }
};
