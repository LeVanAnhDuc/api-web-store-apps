// types
import type { Request } from "express";
import type { MagicLinkSendBody, MagicLinkVerifyBody } from "../types";
import type { MagicLinkLoginRepository } from "../repositories";
import type { LoginResponseDto, MagicLinkSendDto } from "../dtos";
import type {
  AccountExistsGuard,
  AccountActiveGuard,
  EmailVerifiedGuard,
  MagicLinkCooldownGuard
} from "../guards";
import type { LoginAuditService } from "../services/login-audit.service";
import type { LoginCompletionService } from "../services/login-completion.service";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
// config
import { UnauthorizedError } from "@/config/responses/error";
import ENV from "@/config/env";
// dtos
import { toMagicLinkSendDto } from "../dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { hashValue } from "@/utils/crypto/bcrypt";
import { LOGIN_METHODS } from "@/modules/login-history/constants";
import { MAGIC_LINK_CONFIG } from "../constants";

export class MagicLinkLoginStrategy {
  constructor(
    private readonly accountExistsGuard: AccountExistsGuard,
    private readonly accountActiveGuard: AccountActiveGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly magicLinkCooldownGuard: MagicLinkCooldownGuard,
    private readonly magicLinkLoginRepo: MagicLinkLoginRepository,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly audit: LoginAuditService,
    private readonly completion: LoginCompletionService
  ) {}

  async sendLink(
    body: MagicLinkSendBody,
    req: Request
  ): Promise<MagicLinkSendDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("Magic link send initiated", { email });

    await this.magicLinkCooldownGuard.assert(email, t);

    const result = await this.accountExistsGuard.tryFind(email);
    const isEligible =
      result?.auth.isActive === true && result?.auth.verifiedEmail === true;

    if (!isEligible) {
      Logger.debug("Magic link send skipped — account not eligible", {
        email
      });
      hashValue(email);
      withRetry(() => this.magicLinkLoginRepo.setCooldownAfterSend(email), {
        operationName: "setMagicLinkCooldown",
        context: { email }
      });
      return toMagicLinkSendDto(
        this.magicLinkLoginRepo.MAGIC_LINK_EXPIRY_SECONDS,
        this.magicLinkLoginRepo.MAGIC_LINK_COOLDOWN_SECONDS
      );
    }

    const token = await this.magicLinkLoginRepo.createAndStoreToken(email);

    withRetry(() => this.magicLinkLoginRepo.setCooldownAfterSend(email), {
      operationName: "setMagicLinkCooldown",
      context: { email }
    });

    const magicLinkUrl = `${ENV.CLIENT_URL}/login/verify-magic-link?token=${token}&email=${encodeURIComponent(email)}`;
    this.emailDispatcher.send(EmailType.MAGIC_LINK, {
      email,
      data: { magicLinkUrl, expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Magic link send completed", {
      email,
      expiresIn: this.magicLinkLoginRepo.MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: this.magicLinkLoginRepo.MAGIC_LINK_COOLDOWN_SECONDS
    });

    return toMagicLinkSendDto(
      this.magicLinkLoginRepo.MAGIC_LINK_EXPIRY_SECONDS,
      this.magicLinkLoginRepo.MAGIC_LINK_COOLDOWN_SECONDS
    );
  }

  async verifyLink(
    body: MagicLinkVerifyBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, token } = body;
    const { t } = req;

    Logger.info("Magic link verification initiated", { email });

    const { auth, user } = await this.accountExistsGuard.assert(email, t);

    this.accountActiveGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.MAGIC_LINK,
      req,
      t
    );
    this.emailVerifiedGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.MAGIC_LINK,
      req,
      t
    );

    const isValid = await this.magicLinkLoginRepo.verifyToken(email, token);
    if (!isValid) {
      this.audit.recordInvalidMagicLink({ auth, email, req });
      throw new UnauthorizedError(
        t("login:errors.invalidMagicLink"),
        ERROR_CODES.LOGIN_MAGIC_LINK_INVALID
      );
    }

    withRetry(() => this.magicLinkLoginRepo.cleanupAll(email), {
      operationName: "cleanupMagicLinkData",
      context: { email }
    });

    return this.completion.complete({
      auth,
      user,
      method: LOGIN_METHODS.MAGIC_LINK,
      req
    });
  }
}
