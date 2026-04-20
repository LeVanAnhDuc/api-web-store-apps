// types
import type { OtpLoginRepository } from "../repositories/otp-login.repository";
// config
import { BadRequestError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class OtpCooldownGuard {
  constructor(private readonly otpLoginRepo: OtpLoginRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const canSend = await this.otpLoginRepo.checkCooldown(email);

    if (canSend) return;

    const remaining = await this.otpLoginRepo.getCooldownRemaining(email);
    Logger.warn("Login OTP cooldown not expired", { email, remaining });

    throw new BadRequestError(
      t("login:errors.otpCooldown", { seconds: remaining }),
      ERROR_CODES.LOGIN_OTP_COOLDOWN
    );
  }
}
