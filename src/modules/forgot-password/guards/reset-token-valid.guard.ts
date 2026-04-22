// types
import type { ResetTokenRepository } from "../repositories";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class ResetTokenValidGuard {
  constructor(private readonly resetTokenRepo: ResetTokenRepository) {}

  async assert(
    email: string,
    resetToken: string,
    t: TranslateFunction
  ): Promise<void> {
    const isValid = await this.resetTokenRepo.verify(email, resetToken);
    if (isValid) return;

    Logger.warn("Forgot password reset - invalid or expired reset token", {
      email
    });
    throw new UnauthorizedError(
      t("forgotPassword:errors.invalidResetToken"),
      ERROR_CODES.FORGOT_PASSWORD_INVALID_RESET_TOKEN
    );
  }
}
