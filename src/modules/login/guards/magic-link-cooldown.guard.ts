// types
import type { MagicLinkLoginRepository } from "../repositories";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";

export class MagicLinkCooldownGuard {
  constructor(private readonly magicLinkLoginRepo: MagicLinkLoginRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const canSend = await this.magicLinkLoginRepo.checkCooldown(email);

    if (canSend) return;

    const remaining = await this.magicLinkLoginRepo.getCooldownRemaining(email);
    Logger.warn("Magic link cooldown not expired", { email, remaining });

    throw new BadRequestError(
      t("login:errors.magicLinkCooldown", { seconds: remaining }),
      ERROR_CODES.LOGIN_MAGIC_LINK_COOLDOWN
    );
  }
}
