// libs
import crypto from "crypto";
// types
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { UserService } from "@/modules/user/user.service";
import type { UserWithAuth } from "@/types/modules/user";
import type { UnlockAccountRepository } from "./repositories/unlock-account.repository";
// config
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError
} from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";

// ──────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────

export async function checkCooldown(
  repo: UnlockAccountRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const remaining = await repo.getCooldownRemaining(email);

  if (remaining > 0) {
    Logger.warn("Unlock request blocked - cooldown active", {
      email,
      remainingSeconds: remaining
    });
    throw new BadRequestError(
      t("unlockAccount:errors.unlockCooldown", { seconds: remaining }),
      ERROR_CODES.UNLOCK_COOLDOWN
    );
  }
}

export async function checkRateLimit(
  repo: UnlockAccountRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const requestCount = await repo.incrementRequestCount(email);

  if (repo.hasExceededRateLimit(requestCount)) {
    Logger.warn("Unlock request blocked - rate limit exceeded", {
      email,
      requestCount
    });
    throw new TooManyRequestsError(
      t("unlockAccount:errors.unlockRateLimit"),
      ERROR_CODES.UNLOCK_RATE_LIMIT
    );
  }

  Logger.info("Unlock rate limit check passed", {
    email,
    requestCount,
    limit: repo.MAX_REQUESTS_PER_HOUR
  });
}

export async function ensureAuthExists(
  userService: UserService,
  email: string,
  t: TranslateFunction
): Promise<UserWithAuth> {
  const result = await userService.findByEmailWithAuth(email);

  if (!result) {
    Logger.warn("Unlock verify failed - account not found", { email });
    throw new UnauthorizedError(
      t("unlockAccount:errors.invalidTempPassword"),
      ERROR_CODES.UNLOCK_AUTH_NOT_FOUND
    );
  }

  return result;
}

export async function ensureTempPasswordValid(
  auth: AuthenticationDocument,
  email: string,
  tempPassword: string,
  t: TranslateFunction
): Promise<void> {
  if (!auth.tempPasswordHash) {
    Logger.warn("Unlock verify failed - no temp password set", {
      email,
      authId: auth._id
    });
    throw new UnauthorizedError(
      t("unlockAccount:errors.invalidTempPassword"),
      ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
    );
  }

  if (!auth.tempPasswordExpAt || auth.tempPasswordExpAt < new Date()) {
    Logger.warn("Unlock verify failed - temp password expired", {
      email,
      authId: auth._id,
      expiredAt: auth.tempPasswordExpAt
    });
    throw new UnauthorizedError(
      t("unlockAccount:errors.tempPasswordExpired"),
      ERROR_CODES.UNLOCK_TEMP_PASSWORD_EXPIRED
    );
  }

  if (auth.tempPasswordUsed) {
    Logger.warn("Unlock verify failed - temp password already used", {
      email,
      authId: auth._id
    });
    throw new UnauthorizedError(
      t("unlockAccount:errors.invalidTempPassword"),
      ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
    );
  }

  const isValid = await isValidHashedValue(tempPassword, auth.tempPasswordHash);
  if (!isValid) {
    Logger.warn("Unlock verify failed - invalid temp password", {
      email,
      authId: auth._id
    });
    throw new UnauthorizedError(
      t("unlockAccount:errors.invalidTempPassword"),
      ERROR_CODES.UNLOCK_INVALID_TEMP_PASSWORD
    );
  }
}

// ──────────────────────────────────────────────
// Temp password generator
// ──────────────────────────────────────────────

function getRandomChar(chars: string): string {
  const randomIndex = crypto.randomBytes(1).readUInt8(0) % chars.length;
  return chars[randomIndex];
}

function shuffleString(str: string): string {
  const chars = str.split("");

  for (let i = chars.length - 1; i > 0; i--) {
    const randomIndex = crypto.randomBytes(1).readUInt8(0) % (i + 1);
    [chars[i], chars[randomIndex]] = [chars[randomIndex], chars[i]];
  }

  return chars.join("");
}

export function generateTempPassword(length: number = 16): string {
  const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
  const NUMBER_CHARS = "0123456789";
  const SPECIAL_CHARS = "!@#$%^&*";
  const ALL_CHARS =
    UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

  const passwordChars: string[] = [
    getRandomChar(UPPERCASE_CHARS),
    getRandomChar(LOWERCASE_CHARS),
    getRandomChar(NUMBER_CHARS),
    getRandomChar(SPECIAL_CHARS)
  ];

  const remainingLength = length - 4;
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(getRandomChar(ALL_CHARS));
  }

  return shuffleString(passwordChars.join(""));
}
