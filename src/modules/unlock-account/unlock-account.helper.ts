// libs
import crypto from "crypto";
// types
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UnlockAccountRepository } from "./repositories/unlock-account.repository";
// config
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError
} from "@/config/responses/error";
// others
import { Logger } from "@/utils/logger";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";

const TEMP_PASSWORD_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 12;
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*";
const ALL_CHARS =
  UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

export const TEMP_PASSWORD_EXPIRY_MINUTES = 15;

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
      t("unlockAccount:errors.unlockCooldown", { seconds: remaining })
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
    throw new TooManyRequestsError(t("unlockAccount:errors.unlockRateLimit"));
  }

  Logger.info("Unlock rate limit check passed", {
    email,
    requestCount,
    limit: repo.MAX_REQUESTS_PER_HOUR
  });
}

export async function ensureAuthExists(
  authService: AuthenticationService,
  email: string,
  t: TranslateFunction
): Promise<AuthenticationDocument> {
  const auth = await authService.findByEmail(email);

  if (!auth) {
    Logger.warn("Unlock verify failed - account not found", { email });
    throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
  }

  return auth;
}

export async function ensureTempPasswordValid(
  auth: AuthenticationDocument,
  tempPassword: string,
  t: TranslateFunction
): Promise<void> {
  if (!auth.tempPasswordHash) {
    Logger.warn("Unlock verify failed - no temp password set", {
      email: auth.email,
      authId: auth._id
    });
    throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
  }

  if (!auth.tempPasswordExpAt || auth.tempPasswordExpAt < new Date()) {
    Logger.warn("Unlock verify failed - temp password expired", {
      email: auth.email,
      authId: auth._id,
      expiredAt: auth.tempPasswordExpAt
    });
    throw new UnauthorizedError(t("unlockAccount:errors.tempPasswordExpired"));
  }

  if (auth.tempPasswordUsed) {
    Logger.warn("Unlock verify failed - temp password already used", {
      email: auth.email,
      authId: auth._id
    });
    throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
  }

  const isValid = await isValidHashedValue(tempPassword, auth.tempPasswordHash);
  if (!isValid) {
    Logger.warn("Unlock verify failed - invalid temp password", {
      email: auth.email,
      authId: auth._id
    });
    throw new UnauthorizedError(t("unlockAccount:errors.invalidTempPassword"));
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

export function generateTempPassword(
  length: number = TEMP_PASSWORD_LENGTH
): string {
  if (length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Temporary password length must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

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
