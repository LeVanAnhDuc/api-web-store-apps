// types
import type { OtpForgotPasswordRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class OtpResendLimitGuard {
  constructor(private readonly otpRepo: OtpForgotPasswordRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const exceeded = await this.otpRepo.hasExceededResendLimit(email);
    if (!exceeded) return;

    Logger.warn("Forgot password OTP resend limit exceeded", { email });
    throw new BadRequestError(
      t("forgotPassword:errors.otpResendLimitExceeded"),
      ERROR_CODES.FORGOT_PASSWORD_OTP_RESEND_LIMIT
    );
  }
}
