import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import instanceRedis from "@/database/redis/redis.database";
import { Logger } from "@/core/utils/logger";
import { REDIS_KEYS } from "@/shared/constants/redis";
import { LOGIN_LOCKOUT } from "@/shared/constants/modules/login";
import {
  LOGIN_OTP_CONFIG,
  MAGIC_LINK_CONFIG,
  ACCOUNT_UNLOCK_CONFIG
} from "@/shared/constants/modules/session";

const { LOGIN } = REDIS_KEYS;

const KEY_LOGIN_FAILED_ATTEMPTS = LOGIN.FAILED_ATTEMPTS;
const KEY_LOGIN_LOCKOUT = LOGIN.LOCKOUT;

const KEY_OTP_LOGIN = LOGIN.OTP;
const KEY_OTP_LOGIN_COOLDOWN = LOGIN.OTP_COOLDOWN;
const KEY_OTP_LOGIN_FAILED_ATTEMPTS = LOGIN.OTP_FAILED_ATTEMPTS;
const KEY_OTP_LOGIN_RESEND_COUNT = LOGIN.OTP_RESEND_COUNT;

const KEY_MAGIC_LINK = LOGIN.MAGIC_LINK;
const KEY_MAGIC_LINK_COOLDOWN = LOGIN.MAGIC_LINK_COOLDOWN;

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

const calculateLockoutDuration = (attemptCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

  const duration =
    LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS];

  if (attemptCount >= 10) {
    return MAX_LOCKOUT_SECONDS;
  }

  return duration || 0;
};

export const incrementFailedLoginAttempts = async (
  email: string
): Promise<{ attemptCount: number; lockoutSeconds: number }> => {
  try {
    const redis = instanceRedis.getClient();
    const attemptsKey = `${KEY_LOGIN_FAILED_ATTEMPTS}:${email}`;
    const lockoutKey = `${KEY_LOGIN_LOCKOUT}:${email}`;

    const attemptCount = await redis.incr(attemptsKey);

    // Reset window: clear attempts counter after 30 minutes of no failed attempts
    if (attemptCount === 1) {
      await redis.expire(attemptsKey, LOGIN_LOCKOUT.RESET_WINDOW_SECONDS);
    }

    const lockoutSeconds = calculateLockoutDuration(attemptCount);

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

export const deleteLoginOtpCooldown = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN_COOLDOWN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP cooldown deletion failed", error);
  }
};

export const createAndStoreLoginOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    // Hash OTP for security - never store plain OTP
    const hashedOtp = bcrypt.hashSync(otp, LOGIN_OTP_CONFIG.LENGTH);
    await redis.setEx(key, expireTime, hashedOtp);
  } catch (error) {
    Logger.error("Redis login OTP creation failed", error);
  }
};

export const deleteLoginOtp = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis login OTP deletion failed", error);
  }
};

export const verifyLoginOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_OTP_LOGIN}:${email}`;

    const hashedOtp = await redis.get(key);

    if (!hashedOtp) return false;

    // Timing-safe comparison to prevent timing attacks
    return bcrypt.compareSync(otp, hashedOtp);
  } catch (error) {
    Logger.error("Redis login OTP verification failed", error);
    return false;
  }
};

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

export const isLoginOtpLocked = async (email: string): Promise<boolean> => {
  const failedAttempts = await getFailedLoginOtpAttempts(email);
  return failedAttempts >= LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS;
};

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

export const hasExceededLoginOtpResendLimit = async (
  email: string
): Promise<boolean> => {
  const resendCount = await getLoginOtpResendCount(email);
  return resendCount >= LOGIN_OTP_CONFIG.MAX_RESEND_ATTEMPTS;
};

export const cleanupLoginOtpData = async (email: string): Promise<void> => {
  await Promise.all([
    deleteLoginOtp(email),
    deleteLoginOtpCooldown(email),
    clearFailedLoginOtpAttempts(email),
    clearLoginOtpResendCount(email)
  ]);
};

export const generateMagicLinkToken = (): string =>
  crypto.randomBytes(MAGIC_LINK_CONFIG.TOKEN_LENGTH / 2).toString("hex");

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

export const deleteMagicLinkCooldown = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK_COOLDOWN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis magic link cooldown deletion failed", error);
  }
};

export const createAndStoreMagicLink = async (
  email: string,
  token: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK}:${email}`;

    // Hash token for security - never store plain token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await redis.setEx(key, expireTime, hashedToken);
  } catch (error) {
    Logger.error("Redis magic link creation failed", error);
  }
};

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

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  } catch (error) {
    Logger.error("Redis magic link verification failed", error);
    return false;
  }
};

export const deleteMagicLink = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_MAGIC_LINK}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis magic link deletion failed", error);
  }
};

export const cleanupMagicLinkData = async (email: string): Promise<void> => {
  await Promise.all([deleteMagicLink(email), deleteMagicLinkCooldown(email)]);
};

export const generateUnlockToken = (): string =>
  crypto
    .randomBytes(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH / 2)
    .toString("hex");

export const createAndStoreUnlockToken = async (
  email: string,
  token: string,
  expireTime: number
): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_UNLOCK_TOKEN}:${email}`;

    // Hash token for security - never store plain token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await redis.setEx(key, expireTime, hashedToken);
  } catch (error) {
    Logger.error("Redis unlock token creation failed", error);
  }
};

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

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  } catch (error) {
    Logger.error("Redis unlock token verification failed", error);
    return false;
  }
};

export const deleteUnlockToken = async (email: string): Promise<void> => {
  try {
    const redis = instanceRedis.getClient();
    const key = `${KEY_UNLOCK_TOKEN}:${email}`;

    await redis.del(key);
  } catch (error) {
    Logger.error("Redis unlock token deletion failed", error);
  }
};

export const unlockAccount = async (email: string): Promise<void> => {
  await Promise.all([
    resetFailedLoginAttempts(email),
    deleteUnlockToken(email),
    cleanupLoginOtpData(email)
  ]);
};
