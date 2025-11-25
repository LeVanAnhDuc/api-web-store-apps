// database
import instanceRedis from "@/database/redis/redis.database";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import { MILLISECONDS_PER_SECOND } from "@/shared/constants/time";
import { REDIS_KEYS } from "@/shared/constants/redis";
import { LOGIN_LOCKOUT } from "@/shared/constants/login";

const { RATE_LIMIT, LOGIN } = REDIS_KEYS;
const KEY_RATE_LIMIT_IP = RATE_LIMIT.IP;
const KEY_LOGIN_FAILED_ATTEMPTS = LOGIN.FAILED_ATTEMPTS;
const KEY_LOGIN_LOCKOUT = LOGIN.LOCKOUT;

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
    const key = `${KEY_RATE_LIMIT_IP}:login:${ipAddress}:${currentWindow}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count <= maxRequests;
  } catch (error) {
    Logger.error("Redis IP rate limit check failed for login", error);
    return true;
  }
};

/**
 * Check if account is currently locked due to failed login attempts
 * @returns Object with isLocked status and remaining lockout time in seconds
 */
export const checkLoginLockout = async (
  email: string
): Promise<{ isLocked: boolean; remainingSeconds: number }> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_LOGIN_LOCKOUT}:${email}`;

    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return { isLocked: true, remainingSeconds: ttl };
    }

    return { isLocked: false, remainingSeconds: 0 };
  } catch (error) {
    Logger.error("Redis login lockout check failed", error);
    return { isLocked: false, remainingSeconds: 0 };
  }
};

/**
 * Get current failed login attempt count for an email
 */
export const getFailedLoginAttempts = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_LOGIN_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    Logger.error("Redis get failed login attempts failed", error);
    return 0;
  }
};

/**
 * Calculate lockout duration based on attempt count with progressive backoff
 */
const calculateLockoutDuration = (attemptCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

  // Get lockout duration for this attempt level
  const duration =
    LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS];

  // If attempt count >= 10, use max lockout duration
  if (attemptCount >= 10) {
    return MAX_LOCKOUT_SECONDS;
  }

  // Return specific duration or 0 if no lockout for this level
  return duration || 0;
};

/**
 * Increment failed login attempts and apply progressive lockout
 * Returns the new attempt count and lockout duration
 */
export const incrementFailedLoginAttempts = async (
  email: string
): Promise<{ attemptCount: number; lockoutSeconds: number }> => {
  try {
    const redis = instanceRedis.getClient();
    const attemptsKey = `${KEY_LOGIN_FAILED_ATTEMPTS}:${email}`;
    const lockoutKey = `${KEY_LOGIN_LOCKOUT}:${email}`;

    // Increment attempt counter
    const attemptCount = await redis.incr(attemptsKey);

    // Set expiry on attempts counter (30 minutes window for reset)
    if (attemptCount === 1) {
      await redis.expire(attemptsKey, LOGIN_LOCKOUT.RESET_WINDOW_SECONDS);
    }

    // Calculate lockout duration based on attempt count
    const lockoutSeconds = calculateLockoutDuration(attemptCount);

    // Apply lockout if necessary
    if (lockoutSeconds > 0) {
      await redis.setEx(lockoutKey, lockoutSeconds, attemptCount.toString());
    }

    return { attemptCount, lockoutSeconds };
  } catch (error) {
    Logger.error("Redis increment failed login attempts failed", error);
    return { attemptCount: 0, lockoutSeconds: 0 };
  }
};

/**
 * Reset failed login attempts counter (called after successful login)
 */
export const resetFailedLoginAttempts = async (
  email: string
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const attemptsKey = `${KEY_LOGIN_FAILED_ATTEMPTS}:${email}`;
    const lockoutKey = `${KEY_LOGIN_LOCKOUT}:${email}`;

    await Promise.all([redis.del(attemptsKey), redis.del(lockoutKey)]);
  } catch (error) {
    Logger.error("Redis reset failed login attempts failed", error);
  }
};
