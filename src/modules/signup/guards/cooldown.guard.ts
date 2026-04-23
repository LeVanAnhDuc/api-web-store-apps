// types
import type { OtpSignupRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class CooldownGuard {
  constructor(private readonly otpRepo: OtpSignupRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const canSend = await this.otpRepo.checkCooldown(email);

    if (canSend) return;

    const remaining = await this.otpRepo.getCooldownRemaining(email);
    Logger.warn("OTP cooldown not expired", { email, remaining });
    throw new BadRequestError(
      t("signup:errors.resendCoolDown", { seconds: remaining }),
      ERROR_CODES.SIGNUP_OTP_COOLDOWN
    );
  }
}
