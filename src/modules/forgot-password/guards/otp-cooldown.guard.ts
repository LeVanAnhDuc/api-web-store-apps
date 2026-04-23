// types
import type { OtpForgotPasswordRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class OtpCooldownGuard {
  constructor(private readonly otpRepo: OtpForgotPasswordRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const canSend = await this.otpRepo.checkCooldown(email);
    if (canSend) return;

    const remaining = await this.otpRepo.getCooldownRemaining(email);
    Logger.warn("Forgot password OTP cooldown not expired", {
      email,
      remaining
    });
    throw new BadRequestError(
      t("forgotPassword:errors.otpCooldown", { seconds: remaining }),
      ERROR_CODES.FORGOT_PASSWORD_OTP_COOLDOWN
    );
  }
}
