// libs
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
// database
import instanceRedis from "@/database/redis/redis.database";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import { REDIS_KEYS } from "@/shared/constants/redis";
import { LOGIN_LOCKOUT } from "@/shared/constants/modules/login";
import {
  LOGIN_OTP_CONFIG,
  MAGIC_LINK_CONFIG,
  ACCOUNT_UNLOCK_CONFIG
} from "@/shared/constants/modules/session";

const { LOGIN } = REDIS_KEYS;

// Password login keys
const KEY_LOGIN_FAILED_ATTEMPTS = LOGIN.FAILED_ATTEMPTS;
const KEY_LOGIN_LOCKOUT = LOGIN.LOCKOUT;

// OTP login keys
const KEY_OTP_LOGIN = LOGIN.OTP;
const KEY_OTP_LOGIN_COOLDOWN = LOGIN.OTP_COOLDOWN;
const KEY_OTP_LOGIN_FAILED_ATTEMPTS = LOGIN.OTP_FAILED_ATTEMPTS;
const KEY_OTP_LOGIN_RESEND_COUNT = LOGIN.OTP_RESEND_COUNT;

// Magic link keys
const KEY_MAGIC_LINK = LOGIN.MAGIC_LINK;
const KEY_MAGIC_LINK_COOLDOWN = LOGIN.MAGIC_LINK_COOLDOWN;

// Account unlock keys
const KEY_UNLOCK_TOKEN = LOGIN.UNLOCK_TOKEN;

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

// =============================================================================
// Login OTP Operations
// =============================================================================

/**
 * Check if OTP cooldown is active for an email
 * @returns true if can send OTP (no cooldown), false if in cooldown
 */
export const checkLoginOtpCooldown = async (
  email: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_COOLDOWN}:${email}`;

    const exists = await redis.exists(key);
    return exists === 0;
  } catch (error) {
    Logger.error("Redis login OTP cooldown check failed", error);
    return true;
  }
};

/**
 * Get remaining cooldown time for OTP
 * @returns Remaining seconds or 0 if no cooldown
 */
export const getLoginOtpCooldownRemaining = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_COOLDOWN}:${email}`;

    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    Logger.error("Redis login OTP cooldown remaining check failed", error);
    return 0;
  }
};

/**
 * Set OTP cooldown for an email
 */
export const setLoginOtpCooldown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_COOLDOWN}:${email}`;

    await redis.setEx(key, cooldownSeconds, "1");
  } catch (error) {
    Logger.error("Redis login OTP cooldown set failed", error);
  }
};

/**
 * Delete OTP cooldown for an email
 */
export const deleteLoginOtpCooldown = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_COOLDOWN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP cooldown deletion failed", error);
  }
};

/**
 * Hash and store login OTP in Redis
 */
export const createAndStoreLoginOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    // Hash OTP before storing for security
    const hashedOtp = bcrypt.hashSync(otp, LOGIN_OTP_CONFIG.LENGTH);
    await redis.setEx(key, expireTime, hashedOtp);
  } catch (error) {
    Logger.error("Redis login OTP creation failed", error);
  }
};

/**
 * Delete login OTP
 */
export const deleteLoginOtp = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP deletion failed", error);
  }
};

/**
 * Verify login OTP against stored hash
 * @returns true if OTP matches, false otherwise
 */
export const verifyLoginOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    const hashedOtp = await redis.get(key);

    if (!hashedOtp) return false;

    // Use bcrypt.compare for timing-safe comparison
    return bcrypt.compareSync(otp, hashedOtp);
  } catch (error) {
    Logger.error("Redis login OTP verification failed", error);
    return false;
  }
};

/**
 * Increment failed login OTP attempts
 */
export const incrementFailedLoginOtpAttempts = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES * 60);
    }

    return count;
  } catch (error) {
    Logger.error("Redis login OTP failed attempts increment failed", error);
    return 0;
  }
};

/**
 * Get failed login OTP attempts count
 */
export const getFailedLoginOtpAttempts = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_FAILED_ATTEMPTS}:${email}`;

    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    Logger.error("Redis login OTP failed attempts check failed", error);
    return 0;
  }
};

/**
 * Clear failed login OTP attempts
 */
export const clearFailedLoginOtpAttempts = async (
  email: string
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_FAILED_ATTEMPTS}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP failed attempts clear failed", error);
  }
};

/**
 * Check if login OTP is locked due to too many failed attempts
 */
export const isLoginOtpLocked = async (email: string): Promise<boolean> => {
  const failedAttempts = await getFailedLoginOtpAttempts(email);
  return failedAttempts >= LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS;
};

/**
 * Increment login OTP resend count
 */
export const incrementLoginOtpResendCount = async (
  email: string,
  windowSeconds: number
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_RESEND_COUNT}:${email}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count;
  } catch (error) {
    Logger.error("Redis login OTP resend count increment failed", error);
    return 0;
  }
};

/**
 * Get login OTP resend count
 */
export const getLoginOtpResendCount = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_RESEND_COUNT}:${email}`;

    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    Logger.error("Redis login OTP resend count check failed", error);
    return 0;
  }
};

/**
 * Clear login OTP resend count
 */
export const clearLoginOtpResendCount = async (
  email: string
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_RESEND_COUNT}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP resend count clear failed", error);
  }
};

/**
 * Check if max resend limit exceeded
 */
export const hasExceededLoginOtpResendLimit = async (
  email: string
): Promise<boolean> => {
  const resendCount = await getLoginOtpResendCount(email);
  return resendCount >= LOGIN_OTP_CONFIG.MAX_RESEND_ATTEMPTS;
};

/**
 * Cleanup all login OTP data for an email
 */
export const cleanupLoginOtpData = async (email: string): Promise<void> => {
  await Promise.all([
    deleteLoginOtp(email),
    deleteLoginOtpCooldown(email),
    clearFailedLoginOtpAttempts(email),
    clearLoginOtpResendCount(email)
  ]);
};

// =============================================================================
// Magic Link Operations
// =============================================================================

/**
 * Generate secure magic link token
 */
export const generateMagicLinkToken = (): string =>
  crypto.randomBytes(MAGIC_LINK_CONFIG.TOKEN_LENGTH / 2).toString("hex");

/**
 * Check if magic link cooldown is active
 */
export const checkMagicLinkCooldown = async (
  email: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK_COOLDOWN}:${email}`;

    const exists = await redis.exists(key);
    return exists === 0;
  } catch (error) {
    Logger.error("Redis magic link cooldown check failed", error);
    return true;
  }
};

/**
 * Get remaining cooldown time for magic link
 */
export const getMagicLinkCooldownRemaining = async (
  email: string
): Promise<number> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK_COOLDOWN}:${email}`;

    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    Logger.error("Redis magic link cooldown remaining check failed", error);
    return 0;
  }
};

/**
 * Set magic link cooldown
 */
export const setMagicLinkCooldown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK_COOLDOWN}:${email}`;

    await redis.setEx(key, cooldownSeconds, "1");
  } catch (error) {
    Logger.error("Redis magic link cooldown set failed", error);
  }
};

/**
 * Delete magic link cooldown
 */
export const deleteMagicLinkCooldown = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK_COOLDOWN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis magic link cooldown deletion failed", error);
  }
};

/**
 * Store magic link token (hashed) in Redis
 */
export const createAndStoreMagicLink = async (
  email: string,
  token: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK}:${email}`;

    // Hash token before storing
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await redis.setEx(key, expireTime, hashedToken);
  } catch (error) {
    Logger.error("Redis magic link creation failed", error);
  }
};

/**
 * Verify magic link token
 */
export const verifyMagicLinkToken = async (
  email: string,
  token: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK}:${email}`;

    const storedHash = await redis.get(key);

    if (!storedHash) return false;

    const providedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  } catch (error) {
    Logger.error("Redis magic link verification failed", error);
    return false;
  }
};

/**
 * Delete magic link token
 */
export const deleteMagicLink = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis magic link deletion failed", error);
  }
};

/**
 * Cleanup all magic link data for an email
 */
export const cleanupMagicLinkData = async (email: string): Promise<void> => {
  await Promise.all([deleteMagicLink(email), deleteMagicLinkCooldown(email)]);
};

// =============================================================================
// Account Unlock Operations
// =============================================================================

/**
 * Generate secure unlock token
 */
export const generateUnlockToken = (): string =>
  crypto
    .randomBytes(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH / 2)
    .toString("hex");

/**
 * Store account unlock token (hashed)
 */
export const createAndStoreUnlockToken = async (
  email: string,
  token: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_UNLOCK_TOKEN}:${email}`;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await redis.setEx(key, expireTime, hashedToken);
  } catch (error) {
    Logger.error("Redis unlock token creation failed", error);
  }
};

/**
 * Verify account unlock token
 */
export const verifyUnlockToken = async (
  email: string,
  token: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_UNLOCK_TOKEN}:${email}`;

    const storedHash = await redis.get(key);

    if (!storedHash) return false;

    const providedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  } catch (error) {
    Logger.error("Redis unlock token verification failed", error);
    return false;
  }
};

/**
 * Delete account unlock token
 */
export const deleteUnlockToken = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_UNLOCK_TOKEN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis unlock token deletion failed", error);
  }
};

/**
 * Unlock account by clearing all lockout data
 */
export const unlockAccount = async (email: string): Promise<void> => {
  await Promise.all([
    resetFailedLoginAttempts(email),
    deleteUnlockToken(email),
    cleanupLoginOtpData(email)
  ]);
};
