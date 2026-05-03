// types
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { Request } from "express";
import type { OtpSendBody, OtpVerifyBody } from "../types";
import type { OtpLoginRepository } from "../repositories";
import type { LoginResponseDto, OtpSendDto } from "../dtos";
import type {
  AccountExistsGuard,
  AccountActiveGuard,
  EmailVerifiedGuard,
  OtpLockoutGuard,
  OtpCooldownGuard
} from "../guards";
import type { LoginAuditService } from "../services/login-audit.service";
import type { LoginCompletionService } from "../services/login-completion.service";
// common
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError
} from "@/common/exceptions";
// modules
import { LOGIN_METHODS } from "@/modules/login-history/constants";
// dtos
import { toOtpSendDto } from "../dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";
import { withRetry } from "@/utils/resilience/retry";
import { LOGIN_OTP_CONFIG } from "../constants";

export class OtpLoginStrategy {
  constructor(
    private readonly accountExistsGuard: AccountExistsGuard,
    private readonly accountActiveGuard: AccountActiveGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly otpLockoutGuard: OtpLockoutGuard,
    private readonly otpCooldownGuard: OtpCooldownGuard,
    private readonly otpLoginRepo: OtpLoginRepository,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly audit: LoginAuditService,
    private readonly completion: LoginCompletionService
  ) {}

  private isAccountEligible(auth: AuthenticationDocument): boolean {
    return auth.isActive === true && auth.verifiedEmail === true;
  }

  async sendCode(body: OtpSendBody, req: Request): Promise<OtpSendDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("Login OTP send initiated", { email });

    await this.otpCooldownGuard.assert(email, t);

    const result = await this.accountExistsGuard.tryFind(email);
    const isEligible = this.isAccountEligible(result?.auth);

    if (!isEligible) {
      Logger.debug("Login OTP send skipped — account not eligible", { email });
      withRetry(() => this.otpLoginRepo.setRateLimits(email), {
        operationName: "setOtpRateLimits",
        context: { email }
      });
      return toOtpSendDto(
        this.otpLoginRepo.OTP_EXPIRY_SECONDS,
        this.otpLoginRepo.OTP_COOLDOWN_SECONDS
      );
    }

    const exceeded = await this.otpLoginRepo.hasExceededResendLimit(email);
    if (exceeded) {
      Logger.warn("Login OTP resend limit exceeded", { email });
      throw new BadRequestError(
        t("login:errors.otpResendLimitExceeded"),
        ERROR_CODES.LOGIN_OTP_RESEND_LIMIT
      );
    }

    const otp = await this.otpLoginRepo.createAndStoreOtp(email);

    this.otpLoginRepo.setRateLimits(email);

    this.emailDispatcher.send(EmailType.LOGIN_OTP, {
      email,
      data: { otp, expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Login OTP send completed", {
      email,
      expiresIn: this.otpLoginRepo.OTP_EXPIRY_SECONDS,
      cooldown: this.otpLoginRepo.OTP_COOLDOWN_SECONDS
    });

    return toOtpSendDto(
      this.otpLoginRepo.OTP_EXPIRY_SECONDS,
      this.otpLoginRepo.OTP_COOLDOWN_SECONDS
    );
  }

  async verifyCode(
    body: OtpVerifyBody,
    req: Request
  ): Promise<LoginResponseDto> {
    const { email, otp } = body;
    const { t } = req;

    Logger.info("Login OTP verification initiated", { email });

    await this.otpLockoutGuard.assert(email, t);

    const { auth, user } = await this.accountExistsGuard.assert(email, t);

    this.accountActiveGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.OTP,
      req,
      t
    );
    this.emailVerifiedGuard.assertWithAudit(
      auth,
      email,
      LOGIN_METHODS.OTP,
      req,
      t
    );

    const isValid = await this.otpLoginRepo.verify(email, otp);
    if (!isValid) await this.handleInvalidOtp(auth, email, req, t);

    withRetry(() => this.otpLoginRepo.cleanupAll(email), {
      operationName: "cleanupLoginOtpData",
      context: { email }
    });

    return this.completion.complete({
      auth,
      user,
      method: LOGIN_METHODS.OTP,
      req
    });
  }

  private async handleInvalidOtp(
    auth: AuthenticationDocument,
    email: string,
    req: Request,
    t: TranslateFunction
  ): Promise<void> {
    const attempts = await this.otpLoginRepo.incrementFailedAttempts(email);
    this.audit.recordInvalidOtp({ auth, email, attempts, req });

    const remaining = LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new TooManyRequestsError(
        t("login:errors.otpLocked", {
          minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
        }),
        ERROR_CODES.LOGIN_OTP_LOCKED
      );
    }

    throw new UnauthorizedError(
      t("login:errors.invalidOtpWithRemaining", { remaining }),
      ERROR_CODES.LOGIN_OTP_INVALID
    );
  }
}
