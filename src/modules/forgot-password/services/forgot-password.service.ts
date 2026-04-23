// types
import type {
  FPOtpSendRequest,
  FPOtpVerifyRequest,
  FPMagicLinkSendRequest,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest
} from "../types";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { ResetTokenRepository } from "../repositories";
import type {
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  SendMagicLinkResponseDto,
  VerifyMagicLinkResponseDto,
  ResetPasswordResponseDto
} from "../dtos";
import type {
  OtpForgotPasswordStrategy,
  MagicLinkForgotPasswordStrategy
} from "../strategies";
import type { AuthExistsGuard, ResetTokenValidGuard } from "../guards";
import type { ForgotPasswordAuditService } from "./forgot-password-audit.service";
// dtos
import { toResetPasswordResponseDto } from "../dtos";
// others
import { Logger } from "@/libs/logger";
import { hashValue } from "@/utils/crypto/bcrypt";

export class ForgotPasswordService {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly resetTokenRepo: ResetTokenRepository,
    private readonly otpStrategy: OtpForgotPasswordStrategy,
    private readonly magicLinkStrategy: MagicLinkForgotPasswordStrategy,
    private readonly authExistsGuard: AuthExistsGuard,
    private readonly resetTokenValidGuard: ResetTokenValidGuard,
    private readonly audit: ForgotPasswordAuditService
  ) {}

  sendOtp(req: FPOtpSendRequest): Promise<SendOtpResponseDto> {
    return this.otpStrategy.sendCode(req);
  }

  verifyOtp(req: FPOtpVerifyRequest): Promise<VerifyOtpResponseDto> {
    return this.otpStrategy.verifyCode(req);
  }

  sendMagicLink(
    req: FPMagicLinkSendRequest
  ): Promise<SendMagicLinkResponseDto> {
    return this.magicLinkStrategy.sendLink(req);
  }

  verifyMagicLink(
    req: FPMagicLinkVerifyRequest
  ): Promise<VerifyMagicLinkResponseDto> {
    return this.magicLinkStrategy.verifyLink(req);
  }

  async resetPassword(
    req: FPResetPasswordRequest
  ): Promise<ResetPasswordResponseDto> {
    const { email, resetToken, newPassword } = req.body;
    const { t } = req;

    Logger.info("Forgot password reset initiated", { email });

    await this.resetTokenValidGuard.assert(email, resetToken, t);

    const { auth } = await this.authExistsGuard.assert(email, t);

    const hashedPassword = hashValue(newPassword);
    await this.authService.updatePassword(auth._id.toString(), hashedPassword);

    await this.resetTokenRepo.clear(email);

    this.audit.recordPasswordReset({ email, auth, req });

    return toResetPasswordResponseDto();
  }
}
