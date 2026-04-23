// types
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { FPOtpSendRequest, FPOtpVerifyRequest } from "../types";
import type {
  OtpForgotPasswordRepository,
  ResetTokenRepository
} from "../repositories";
import type { SendOtpResponseDto, VerifyOtpResponseDto } from "../dtos";
import type {
  OtpCooldownGuard,
  OtpResendLimitGuard,
  OtpLockoutGuard,
  AuthExistsGuard
} from "../guards";
import type { ForgotPasswordAuditService } from "../services/forgot-password-audit.service";
// common
import { BadRequestError, UnauthorizedError } from "@/common/exceptions";
// dtos
import { toSendOtpResponseDto, toVerifyOtpResponseDto } from "../dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/resilience/retry";
import { FORGOT_PASSWORD_OTP_CONFIG } from "../constants";

export class OtpForgotPasswordStrategy {
  constructor(
    private readonly otpRepo: OtpForgotPasswordRepository,
    private readonly resetTokenRepo: ResetTokenRepository,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly cooldownGuard: OtpCooldownGuard,
    private readonly resendLimitGuard: OtpResendLimitGuard,
    private readonly lockoutGuard: OtpLockoutGuard,
    private readonly authExistsGuard: AuthExistsGuard,
    private readonly audit: ForgotPasswordAuditService
  ) {}

  async sendCode(req: FPOtpSendRequest): Promise<SendOtpResponseDto> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password OTP send initiated", { email });

    await this.cooldownGuard.assert(email, t);
    await this.resendLimitGuard.assert(email, t);

    const result = await this.authExistsGuard.tryFind(email);

    if (!result || !result.auth.isActive) {
      Logger.info(
        "Forgot password OTP - email not found or inactive (fake success)",
        { email }
      );
      return toSendOtpResponseDto(
        this.otpRepo.OTP_EXPIRY_SECONDS,
        this.otpRepo.OTP_COOLDOWN_SECONDS
      );
    }

    const otp = await this.otpRepo.createAndStoreOtp(email);

    withRetry(() => this.otpRepo.setRateLimits(email), {
      operationName: "setForgotPasswordOtpRateLimits",
      context: { email }
    });

    this.emailDispatcher.send(EmailType.FORGOT_PASSWORD_OTP, {
      email,
      data: { otp, expiryMinutes: FORGOT_PASSWORD_OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Forgot password OTP send completed", {
      email,
      expiresIn: this.otpRepo.OTP_EXPIRY_SECONDS,
      cooldown: this.otpRepo.OTP_COOLDOWN_SECONDS
    });

    return toSendOtpResponseDto(
      this.otpRepo.OTP_EXPIRY_SECONDS,
      this.otpRepo.OTP_COOLDOWN_SECONDS
    );
  }

  async verifyCode(req: FPOtpVerifyRequest): Promise<VerifyOtpResponseDto> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("Forgot password OTP verification initiated", { email });

    await this.lockoutGuard.assert(email, t);

    const { auth } = await this.authExistsGuard.assert(email, t);

    const isValid = await this.otpRepo.verify(email, otp);
    if (!isValid) await this.handleInvalidOtp(email, auth, req, t);

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.otpRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordOtpData",
      context: { email }
    });

    Logger.info("Forgot password OTP verified successfully", { email });

    return toVerifyOtpResponseDto(resetToken);
  }

  private async handleInvalidOtp(
    email: string,
    auth: Awaited<ReturnType<AuthExistsGuard["assert"]>>["auth"],
    req: FPOtpVerifyRequest,
    t: TranslateFunction
  ): Promise<never> {
    const attempts = await this.otpRepo.incrementFailedAttempts(email);
    this.audit.recordInvalidOtp({ email, auth, attempts, req });

    const remaining = FORGOT_PASSWORD_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new BadRequestError(
        t("forgotPassword:errors.otpLocked", {
          minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
        }),
        ERROR_CODES.FORGOT_PASSWORD_OTP_LOCKED
      );
    }

    throw new UnauthorizedError(
      t("forgotPassword:errors.invalidOtpWithRemaining", { remaining }),
      ERROR_CODES.FORGOT_PASSWORD_OTP_INVALID
    );
  }
}
