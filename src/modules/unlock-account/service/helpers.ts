import crypto from "crypto";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import { Logger } from "@/utils/logger";
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError
} from "@/configurations/responses/error";
import {
  redisTtl,
  redisIncr,
  redisExpire,
  redisSetEx
} from "@/utils/store/redis-operations";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { failedAttemptsStore } from "@/modules/login/store";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const COOLDOWN_SECONDS = 60;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_UNLOCK_REQUESTS_PER_HOUR = 3;
export const TEMP_PASSWORD_EXPIRY_MINUTES = 15;

// ──────────────────────────────────────────────
// Unlock request helpers
// ──────────────────────────────────────────────

export const checkCooldown = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const cooldownKey = `${REDIS_KEYS.LOGIN.UNLOCK_COOLDOWN}:${email}`;
  const ttl = await redisTtl(cooldownKey);

  if (ttl > 0) {
    Logger.warn("Unlock request blocked - cooldown active", {
      email,
      remainingSeconds: ttl
    });

    throw new BadRequestError(
      t("unlockAccount:errors.unlockCooldown", { seconds: ttl })
    );
  }
};

export const checkRateLimit = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const rateLimitKey = `${REDIS_KEYS.LOGIN.UNLOCK_RATE}:${email}`;
  const requestCount = await redisIncr(rateLimitKey);

  if (requestCount === 1) {
    await redisExpire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
  }

  if (requestCount > MAX_UNLOCK_REQUESTS_PER_HOUR) {
    Logger.warn("Unlock request blocked - rate limit exceeded", {
      email,
      requestCount
    });

    throw new TooManyRequestsError(t("unlockAccount:errors.unlockRateLimit"));
  }

  Logger.info("Unlock rate limit check passed", {
    email,
    requestCount,
    limit: MAX_UNLOCK_REQUESTS_PER_HOUR
  });
};

export const setCooldown = async (email: string): Promise<void> => {
  const cooldownKey = `${REDIS_KEYS.LOGIN.UNLOCK_COOLDOWN}:${email}`;
  await redisSetEx(cooldownKey, COOLDOWN_SECONDS, "1");

  Logger.debug("Unlock cooldown set", {
    email,
    seconds: COOLDOWN_SECONDS
  });
};

export const ensureAccountActive = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.isActive) return;

  Logger.warn("Unlock request for disabled account", {
    email,
    authId: auth._id
  });

  throw new BadRequestError(t("unlockAccount:errors.accountDisabled"));
};

export const ensureAccountLocked = async (
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction
): Promise<void> => {
  const { isLocked } = await failedAttemptsStore.checkLockout(email);

  if (isLocked) return;

  Logger.info("Unlock request for non-locked account", {
    email,
    authId: auth._id
  });

  throw new BadRequestError(t("unlockAccount:errors.accountNotLocked"));
};

// ──────────────────────────────────────────────
// Unlock verify helpers
// ──────────────────────────────────────────────

export function ensureAccountExists(
  auth: AuthenticationDocument | null,
  email: string,
  t: TranslateFunction
): asserts auth is AuthenticationDocument {
  if (auth) return;

  Logger.warn("Unlock verify failed - account not found", { email });
  throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
}

export const ensureTempPasswordSet = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.tempPasswordHash) return;

  Logger.warn("Unlock verify failed - no temp password set", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
};

export const ensureTempPasswordNotExpired = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.tempPasswordExpAt && auth.tempPasswordExpAt >= new Date()) return;

  Logger.warn("Unlock verify failed - temp password expired", {
    email,
    authId: auth._id,
    expiredAt: auth.tempPasswordExpAt
  });

  throw new UnauthorizedError(t("unlockAccount:errors.tempPasswordExpired"));
};

export const ensureTempPasswordNotUsed = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (!auth.tempPasswordUsed) return;

  Logger.warn("Unlock verify failed - temp password already used", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
};

export const verifyTempPasswordOrFail = async (
  auth: AuthenticationDocument,
  tempPassword: string,
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const isValid = auth.tempPasswordHash
    ? await isValidHashedValue(tempPassword, auth.tempPasswordHash)
    : false;

  if (isValid) return;

  Logger.warn("Unlock verify failed - invalid temp password", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
};

// ──────────────────────────────────────────────
// Temp password generator
// ──────────────────────────────────────────────

const TEMP_PASSWORD_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 12;

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*";
const ALL_CHARS =
  UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

const getRandomChar = (chars: string): string => {
  const randomIndex = crypto.randomBytes(1).readUInt8(0) % chars.length;
  return chars[randomIndex];
};

const shuffleString = (str: string): string => {
  const chars = str.split("");

  for (let i = chars.length - 1; i > 0; i--) {
    const randomIndex = crypto.randomBytes(1).readUInt8(0) % (i + 1);
    [chars[i], chars[randomIndex]] = [chars[randomIndex], chars[i]];
  }

  return chars.join("");
};

export const generateTempPassword = (
  length: number = TEMP_PASSWORD_LENGTH
): string => {
  if (length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Temporary password length must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  const passwordChars: string[] = [];

  passwordChars.push(getRandomChar(UPPERCASE_CHARS));
  passwordChars.push(getRandomChar(LOWERCASE_CHARS));
  passwordChars.push(getRandomChar(NUMBER_CHARS));
  passwordChars.push(getRandomChar(SPECIAL_CHARS));

  const remainingLength = length - 4;
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(getRandomChar(ALL_CHARS));
  }

  return shuffleString(passwordChars.join(""));
};
