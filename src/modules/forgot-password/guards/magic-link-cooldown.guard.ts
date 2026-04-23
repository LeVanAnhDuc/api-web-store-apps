// types
import type { MagicLinkForgotPasswordRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class MagicLinkCooldownGuard {
  constructor(
    private readonly magicLinkRepo: MagicLinkForgotPasswordRepository
  ) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const canSend = await this.magicLinkRepo.checkCooldown(email);
    if (canSend) return;

    const remaining = await this.magicLinkRepo.getCooldownRemaining(email);
    Logger.warn("Forgot password magic link cooldown not expired", {
      email,
      remaining
    });
    throw new BadRequestError(
      t("forgotPassword:errors.magicLinkCooldown", { seconds: remaining }),
      ERROR_CODES.FORGOT_PASSWORD_MAGIC_LINK_COOLDOWN
    );
  }
}
