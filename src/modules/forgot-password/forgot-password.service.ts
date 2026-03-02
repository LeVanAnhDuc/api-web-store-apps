import type {
  FPOtpSendRequest,
  FPOtpSendResponse,
  FPOtpVerifyRequest,
  FPVerifyResponse
} from "@/types/modules/forgot-password";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import {
  BadRequestError,
  UnauthorizedError
} from "@/configurations/responses/error";
import type authenticationRepository from "@/repositories/authentication";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { OtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import type { ResetTokenRepository } from "./repositories/reset-token.repository";
import {
  sendEmailService,
  EmailType
} from "@/modules/send-email/send-email.module";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/constants/enums";
import { FORGOT_PASSWORD_OTP_CONFIG } from "@/constants/config";

export class ForgotPasswordService {
  constructor(
    private readonly authRepo: typeof authenticationRepository,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly otpRepo: OtpForgotPasswordRepository,
    private readonly resetTokenRepo: ResetTokenRepository
  ) {}

  // ──────────────────────────────────────────────
  // Send OTP
  // ──────────────────────────────────────────────

  async sendOtp(
    req: FPOtpSendRequest
  ): Promise<Partial<ResponsePattern<FPOtpSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password OTP send initiated", { email });

    await this.ensureCooldownExpired(email, t);
    await this.ensureResendLimitNotExceeded(email, t);

    const auth = await this.authRepo.findByEmail(email);

    if (!auth || !auth.isActive) {
      Logger.info(
        "Forgot password OTP - email not found or inactive (fake success)",
        { email }
      );
      return this.buildOtpSendResponse(t);
    }

    const otp = await this.otpRepo.createAndStoreOtp(email);

    withRetry(() => this.otpRepo.setRateLimits(email), {
      operationName: "setForgotPasswordOtpRateLimits",
      context: { email }
    });

    sendEmailService.send(EmailType.FORGOT_PASSWORD_OTP, {
      email,
      data: { otp, expiryMinutes: FORGOT_PASSWORD_OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("Forgot password OTP send completed", {
      email,
      expiresIn: this.otpRepo.OTP_EXPIRY_SECONDS,
      cooldown: this.otpRepo.OTP_COOLDOWN_SECONDS
    });

    return this.buildOtpSendResponse(t);
  }

  // ──────────────────────────────────────────────
  // Verify OTP
  // ──────────────────────────────────────────────

  async verifyOtp(
    req: FPOtpVerifyRequest
  ): Promise<Partial<ResponsePattern<FPVerifyResponse>>> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("Forgot password OTP verification initiated", { email });

    await this.ensureOtpNotLocked(email, t);

    const auth = await this.ensureAuthExists(email, t);

    const isValid = await this.otpRepo.verify(email, otp);

    if (!isValid) await this.handleInvalidOtp(email, auth, t, req);

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.otpRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordOtpData",
      context: { email }
    });

    Logger.info("Forgot password OTP verified successfully", { email });

    return {
      message: t("forgotPassword:success.otpVerified"),
      data: {
        success: true,
        resetToken
      }
    };
  }

  // ──────────────────────────────────────────────
  // Private helpers — OTP send
  // ──────────────────────────────────────────────

  private buildOtpSendResponse(
    t: TranslateFunction
  ): Partial<ResponsePattern<FPOtpSendResponse>> {
    return {
      message: t("forgotPassword:success.otpSent"),
      data: {
        success: true,
        expiresIn: this.otpRepo.OTP_EXPIRY_SECONDS,
        cooldown: this.otpRepo.OTP_COOLDOWN_SECONDS
      }
    };
  }

  private async ensureCooldownExpired(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const canSend = await this.otpRepo.checkCooldown(email);

    if (!canSend) {
      const remaining = await this.otpRepo.getCooldownRemaining(email);
      Logger.warn("Forgot password OTP cooldown not expired", {
        email,
        remaining
      });
      throw new BadRequestError(
        t("forgotPassword:errors.otpCooldown", { seconds: remaining })
      );
    }
  }

  private async ensureResendLimitNotExceeded(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const exceeded = await this.otpRepo.hasExceededResendLimit(email);

    if (exceeded) {
      Logger.warn("Forgot password OTP resend limit exceeded", { email });
      throw new BadRequestError(
        t("forgotPassword:errors.otpResendLimitExceeded")
      );
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers — OTP verify
  // ──────────────────────────────────────────────

  private async ensureAuthExists(
    email: string,
    t: TranslateFunction
  ): Promise<AuthenticationDocument> {
    const auth = await this.authRepo.findByEmail(email);

    if (!auth) {
      Logger.warn("Forgot password - authentication not found", { email });
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    return auth;
  }

  private async ensureOtpNotLocked(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const isLocked = await this.otpRepo.isLocked(email);

    if (!isLocked) return;

    const attempts = await this.otpRepo.getFailedAttemptCount(email);
    Logger.warn("Forgot password OTP verification locked", {
      email,
      attempts
    });

    throw new BadRequestError(
      t("forgotPassword:errors.otpLocked", {
        minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      })
    );
  }

  private async handleInvalidOtp(
    email: string,
    auth: AuthenticationDocument,
    t: TranslateFunction,
    req: FPOtpVerifyRequest
  ): Promise<never> {
    const attempts = await this.trackFailedOtpAttempt(email, auth, req);
    const remaining = FORGOT_PASSWORD_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new BadRequestError(
        t("forgotPassword:errors.otpLocked", {
          minutes: FORGOT_PASSWORD_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
        })
      );
    }

    throw new UnauthorizedError(
      t("forgotPassword:errors.invalidOtpWithRemaining", { remaining })
    );
  }

  private async trackFailedOtpAttempt(
    email: string,
    auth: AuthenticationDocument,
    req: FPOtpVerifyRequest
  ): Promise<number> {
    const attempts = await this.otpRepo.incrementFailedAttempts(email);

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
      req
    });

    Logger.warn("Forgot password OTP verification failed", {
      email,
      attempts
    });
    return attempts;
  }
}
