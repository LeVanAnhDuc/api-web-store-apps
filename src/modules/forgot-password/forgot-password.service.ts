// types
import type {
  FPOtpSendRequest,
  FPOtpVerifyRequest,
  FPMagicLinkSendRequest,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest
} from "@/types/modules/forgot-password";
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { OtpForgotPasswordRepository } from "./repositories/otp-forgot-password.repository";
import type { MagicLinkForgotPasswordRepository } from "./repositories/magic-link-forgot-password.repository";
import type { ResetTokenRepository } from "./repositories/reset-token.repository";
import type {
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  SendMagicLinkResponseDto,
  VerifyMagicLinkResponseDto,
  ResetPasswordResponseDto
} from "./dtos";
// config
import { UnauthorizedError } from "@/config/responses/error";
// dtos
import {
  toSendOtpResponseDto,
  toVerifyOtpResponseDto,
  toSendMagicLinkResponseDto,
  toVerifyMagicLinkResponseDto,
  toResetPasswordResponseDto
} from "./dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { hashValue } from "@/utils/crypto/bcrypt";
import {
  ensureOtpCooldownExpired,
  ensureOtpResendLimitNotExceeded,
  ensureAuthExists,
  ensureOtpNotLocked,
  handleInvalidOtp,
  sendMagicLinkEmail,
  ensureMagicLinkCooldownExpired,
  ensureMagicLinkResendLimitNotExceeded,
  handleInvalidMagicLink
} from "./forgot-password.helper";
import { LOGIN_METHODS } from "@/constants/modules/login-history";
import { FORGOT_PASSWORD_OTP_CONFIG } from "@/constants/modules/forgot-password";

export class ForgotPasswordService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly otpRepo: OtpForgotPasswordRepository,
    private readonly magicLinkRepo: MagicLinkForgotPasswordRepository,
    private readonly resetTokenRepo: ResetTokenRepository,
    private readonly emailDispatcher: EmailDispatcher
  ) {}

  async sendOtp(req: FPOtpSendRequest): Promise<SendOtpResponseDto> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password OTP send initiated", { email });

    await ensureOtpCooldownExpired(this.otpRepo, email, t);
    await ensureOtpResendLimitNotExceeded(this.otpRepo, email, t);

    const result = await this.userService.findByEmailWithAuth(email);

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

  async verifyOtp(req: FPOtpVerifyRequest): Promise<VerifyOtpResponseDto> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("Forgot password OTP verification initiated", { email });

    await ensureOtpNotLocked(this.otpRepo, email, t);

    const { auth } = await ensureAuthExists(this.userService, email, t);

    const isValid = await this.otpRepo.verify(email, otp);

    if (!isValid)
      await handleInvalidOtp(
        this.otpRepo,
        this.loginHistoryService,
        email,
        auth,
        t,
        req
      );

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.otpRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordOtpData",
      context: { email }
    });

    Logger.info("Forgot password OTP verified successfully", { email });

    return toVerifyOtpResponseDto(resetToken);
  }

  async sendMagicLink(
    req: FPMagicLinkSendRequest
  ): Promise<SendMagicLinkResponseDto> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Forgot password magic link send initiated", { email });

    await ensureMagicLinkCooldownExpired(this.magicLinkRepo, email, t);
    await ensureMagicLinkResendLimitNotExceeded(this.magicLinkRepo, email, t);

    const result = await this.userService.findByEmailWithAuth(email);

    if (!result || !result.auth.isActive) {
      Logger.info(
        "Forgot password magic link - email not found or inactive (fake success)",
        { email }
      );
      return toSendMagicLinkResponseDto(
        this.magicLinkRepo.MAGIC_LINK_EXPIRY_SECONDS,
        this.magicLinkRepo.MAGIC_LINK_COOLDOWN_SECONDS
      );
    }

    const token = await this.magicLinkRepo.createAndStoreToken(email);

    withRetry(() => this.magicLinkRepo.setRateLimits(email), {
      operationName: "setForgotPasswordMagicLinkRateLimits",
      context: { email }
    });

    sendMagicLinkEmail(this.emailDispatcher, email, token, language);

    Logger.info("Forgot password magic link send completed", {
      email,
      expiresIn: this.magicLinkRepo.MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: this.magicLinkRepo.MAGIC_LINK_COOLDOWN_SECONDS
    });

    return toSendMagicLinkResponseDto(
      this.magicLinkRepo.MAGIC_LINK_EXPIRY_SECONDS,
      this.magicLinkRepo.MAGIC_LINK_COOLDOWN_SECONDS
    );
  }

  async verifyMagicLink(
    req: FPMagicLinkVerifyRequest
  ): Promise<VerifyMagicLinkResponseDto> {
    const { email, token } = req.body;
    const { t } = req;

    Logger.info("Forgot password magic link verification initiated", { email });

    const { auth } = await ensureAuthExists(this.userService, email, t);

    const isValid = await this.magicLinkRepo.verifyToken(email, token);

    if (!isValid)
      return handleInvalidMagicLink(
        this.loginHistoryService,
        email,
        auth,
        req,
        t
      );

    const resetToken = await this.resetTokenRepo.createAndStore(email);

    withRetry(() => this.magicLinkRepo.cleanupAll(email), {
      operationName: "cleanupForgotPasswordMagicLinkData",
      context: { email }
    });

    Logger.info("Forgot password magic link verified successfully", { email });

    return toVerifyMagicLinkResponseDto(resetToken);
  }

  async resetPassword(
    req: FPResetPasswordRequest
  ): Promise<ResetPasswordResponseDto> {
    const { email, resetToken, newPassword } = req.body;
    const { t } = req;

    Logger.info("Forgot password reset initiated", { email });

    const isValidToken = await this.resetTokenRepo.verify(email, resetToken);

    if (!isValidToken) {
      Logger.warn("Forgot password reset - invalid or expired reset token", {
        email
      });
      throw new UnauthorizedError(
        t("forgotPassword:errors.invalidResetToken"),
        ERROR_CODES.FORGOT_PASSWORD_INVALID_RESET_TOKEN
      );
    }

    const { auth } = await ensureAuthExists(this.userService, email, t);

    const hashedPassword = hashValue(newPassword);
    await this.authService.updatePassword(auth._id.toString(), hashedPassword);

    await this.resetTokenRepo.clear(email);

    this.loginHistoryService.recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.FORGOT_PASSWORD,
      req
    });

    Logger.info("Forgot password reset completed successfully", { email });

    return toResetPasswordResponseDto();
  }
}
