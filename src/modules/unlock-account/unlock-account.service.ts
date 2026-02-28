import crypto from "crypto";
import type { LoginResponse } from "@/types/modules/login";
import type { UnlockVerifyRequest } from "@/types/modules/unlock-account";
import { Logger } from "@/utils/logger";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { withRetry } from "@/utils/retry";
import { generateAuthTokensResponse } from "@/utils/token";
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError
} from "@/configurations/responses/error";
import type authenticationRepository from "@/repositories/authentication";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { FailedAttemptsRepository } from "@/modules/login/repositories/failed-attempts.repository";
import type { UnlockAccountRepository } from "./repositories/unlock-account.repository";
import { LOGIN_METHODS } from "@/constants/enums";
import {
  sendEmailService,
  EmailType
} from "@/modules/send-email/send-email.module";
import ENV from "@/configurations/env";

const TEMP_PASSWORD_EXPIRY_MINUTES = 15;
const TEMP_PASSWORD_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 12;
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*";
const ALL_CHARS =
  UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

export class UnlockAccountService {
  constructor(
    private readonly authRepo: typeof authenticationRepository,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly failedAttemptsRepo: FailedAttemptsRepository,
    private readonly unlockAccountRepo: UnlockAccountRepository
  ) {}

  async unlockRequest(
    email: string,
    t: TranslateFunction,
    language: string
  ): Promise<{ success: boolean }> {
    Logger.info("Processing unlock request", { email });

    await this.checkCooldown(email, t);
    await this.checkRateLimit(email, t);

    const auth = await this.authRepo.findByEmail(email);

    if (!auth) {
      Logger.warn("Unlock request for non-existent email", { email });
      await this.unlockAccountRepo.setCooldown(email);
      return { success: true };
    }

    if (!auth.isActive) {
      Logger.warn("Unlock request for disabled account", {
        email,
        authId: auth._id
      });
      throw new BadRequestError(t("unlockAccount:errors.accountDisabled"));
    }

    const { isLocked } = await this.failedAttemptsRepo.checkLockout(email);
    if (!isLocked) {
      Logger.info("Unlock request for non-locked account", {
        email,
        authId: auth._id
      });
      throw new BadRequestError(t("unlockAccount:errors.accountNotLocked"));
    }

    const tempPassword = this.generateTempPassword();
    const tempPasswordHash = await hashValue(tempPassword);
    const tempPasswordExpAt = new Date(
      Date.now() + TEMP_PASSWORD_EXPIRY_MINUTES * 60 * 1000
    );

    await this.authRepo.storeTempPassword(
      auth._id.toString(),
      tempPasswordHash,
      tempPasswordExpAt
    );

    Logger.info("Temporary password generated and saved", {
      email,
      authId: auth._id,
      expiresAt: tempPasswordExpAt
    });

    sendEmailService.send(EmailType.UNLOCK_TEMP_PASSWORD, {
      email,
      data: {
        tempPassword,
        loginUrl: ENV.CLIENT_URL || "http://localhost:3000/login"
      },
      locale: language as I18n.Locale
    });

    await this.unlockAccountRepo.setCooldown(email);

    Logger.info("Unlock email sent successfully", { email });

    return { success: true };
  }

  async unlockVerify(req: UnlockVerifyRequest): Promise<LoginResponse> {
    const { email, tempPassword } = req.body;
    const { t } = req;

    Logger.info("Processing unlock verify", { email });

    const auth = await this.authRepo.findByEmail(email);

    if (!auth) {
      Logger.warn("Unlock verify failed - account not found", { email });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword")
      );
    }

    if (!auth.tempPasswordHash) {
      Logger.warn("Unlock verify failed - no temp password set", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword")
      );
    }

    if (!auth.tempPasswordExpAt || auth.tempPasswordExpAt < new Date()) {
      Logger.warn("Unlock verify failed - temp password expired", {
        email,
        authId: auth._id,
        expiredAt: auth.tempPasswordExpAt
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.tempPasswordExpired")
      );
    }

    if (auth.tempPasswordUsed) {
      Logger.warn("Unlock verify failed - temp password already used", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword")
      );
    }

    const isValid = await isValidHashedValue(
      tempPassword,
      auth.tempPasswordHash
    );
    if (!isValid) {
      Logger.warn("Unlock verify failed - invalid temp password", {
        email,
        authId: auth._id
      });
      throw new UnauthorizedError(
        t("unlockAccount:errors.invalidTempPassword")
      );
    }

    Logger.info("Temp password verified successfully", {
      email,
      authId: auth._id
    });

    withRetry(() => this.failedAttemptsRepo.resetAll(email), {
      operationName: "resetFailedAttemptsAfterUnlock",
      context: { email }
    });

    await this.authRepo.markTempPasswordUsed(auth._id.toString());

    Logger.info("Temp password marked as used", {
      email,
      authId: auth._id
    });

    this.loginHistoryService.recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      req
    });

    Logger.info("Unlock successful - tokens generated", {
      email,
      authId: auth._id
    });

    return generateAuthTokensResponse({
      userId: auth._id.toString(),
      authId: auth._id.toString(),
      email: auth.email,
      roles: auth.roles
    });
  }

  // ──────────────────────────────────────────────
  // Unlock request helpers
  // ──────────────────────────────────────────────

  private async checkCooldown(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const remaining = await this.unlockAccountRepo.getCooldownRemaining(email);

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

  private async checkRateLimit(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const requestCount =
      await this.unlockAccountRepo.incrementRequestCount(email);

    if (this.unlockAccountRepo.hasExceededRateLimit(requestCount)) {
      Logger.warn("Unlock request blocked - rate limit exceeded", {
        email,
        requestCount
      });
      throw new TooManyRequestsError(t("unlockAccount:errors.unlockRateLimit"));
    }

    Logger.info("Unlock rate limit check passed", {
      email,
      requestCount,
      limit: this.unlockAccountRepo.MAX_REQUESTS_PER_HOUR
    });
  }

  // ──────────────────────────────────────────────
  // Temp password generator
  // ──────────────────────────────────────────────

  private generateTempPassword(length: number = TEMP_PASSWORD_LENGTH): string {
    if (length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Temporary password length must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const passwordChars: string[] = [
      this.getRandomChar(UPPERCASE_CHARS),
      this.getRandomChar(LOWERCASE_CHARS),
      this.getRandomChar(NUMBER_CHARS),
      this.getRandomChar(SPECIAL_CHARS)
    ];

    const remainingLength = length - 4;
    for (let i = 0; i < remainingLength; i++) {
      passwordChars.push(this.getRandomChar(ALL_CHARS));
    }

    return this.shuffleString(passwordChars.join(""));
  }

  private getRandomChar(chars: string): string {
    const randomIndex = crypto.randomBytes(1).readUInt8(0) % chars.length;
    return chars[randomIndex];
  }

  private shuffleString(str: string): string {
    const chars = str.split("");

    for (let i = chars.length - 1; i > 0; i--) {
      const randomIndex = crypto.randomBytes(1).readUInt8(0) % (i + 1);
      [chars[i], chars[randomIndex]] = [chars[randomIndex], chars[i]];
    }

    return chars.join("");
  }
}
