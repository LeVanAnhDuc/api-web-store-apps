// types
import type { OtpLoginRepository } from "../repositories/otp-login.repository";
// config
import { BadRequestError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { LOGIN_OTP_CONFIG } from "@/constants/modules/login";

export class OtpLockoutGuard {
  constructor(private readonly otpLoginRepo: OtpLoginRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const isLocked = await this.otpLoginRepo.isLocked(email);

    if (!isLocked) return;

    const attempts = await this.otpLoginRepo.getFailedAttemptCount(email);
    Logger.warn("Login OTP verification locked", { email, attempts });

    throw new BadRequestError(
      t("login:errors.otpLocked", {
        minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      }),
      ERROR_CODES.LOGIN_OTP_LOCKED
    );
  }
}
