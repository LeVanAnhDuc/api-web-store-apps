// types
import type { UnlockAccountRepository } from "../unlock-account.repository";
// common
import { BadRequestError } from "@/common/exceptions";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class CooldownGuard {
  constructor(private readonly repo: UnlockAccountRepository) {}

  async assert(email: string, t: TranslateFunction): Promise<void> {
    const remaining = await this.repo.getCooldownRemaining(email);

    if (remaining > 0) {
      Logger.warn("Unlock request blocked - cooldown active", {
        email,
        remainingSeconds: remaining
      });
      throw new BadRequestError(
        t("unlockAccount:errors.unlockCooldown", { seconds: remaining }),
        ERROR_CODES.UNLOCK_COOLDOWN
      );
    }
  }
}
