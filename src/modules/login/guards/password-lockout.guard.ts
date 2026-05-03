// types
import type { FailedAttemptsRepository } from "../repositories";
// common
import { TooManyRequestsError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class PasswordLockoutGuard {
  constructor(private readonly failedAttemptsRepo: FailedAttemptsRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const { isLocked, remainingSeconds } =
      await this.failedAttemptsRepo.checkLockout(email);

    if (!isLocked) return;

    const attemptCount = await this.failedAttemptsRepo.getCount(email);

    Logger.warn("Login blocked - account locked", {
      email,
      attemptCount,
      remainingSeconds
    });

    throw new TooManyRequestsError(
      t("login:errors.accountLocked", {
        attempts: attemptCount,
        seconds: remainingSeconds
      }),
      ERROR_CODES.LOGIN_ACCOUNT_LOCKED
    );
  }
}
