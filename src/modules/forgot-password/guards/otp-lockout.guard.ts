// types
import type { OtpForgotPasswordRepository } from "../repositories";
// config
import { BadRequestError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { FORGOT_PASSWORD_OTP_CONFIG } from "../constants";

export class OtpLockoutGuard {
  constructor(private readonly otpRepo: OtpForgotPasswordRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const isLocked = await this.otpRepo.isLocked(email);
    if (!isLocked) return;

    const attempts = await this.otpRepo.getFailedAttemptCount(email);
    Logger.warn("Forgot password OTP verification locked", { email, attempts });

    throw new BadRequestError(
      t("forgotPassword:errors.otpLocked", {
        minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      }),
      ERROR_CODES.FORGOT_PASSWORD_OTP_LOCKED
    );
  }
}
