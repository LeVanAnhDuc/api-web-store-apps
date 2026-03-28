import { Router } from "express";
import type {
  FPOtpSendRequest,
  FPOtpVerifyRequest,
  FPMagicLinkSendRequest,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest
} from "@/types/modules/forgot-password";
import type { HandlerResult } from "@/types/http";
import type { ForgotPasswordService } from "./forgot-password.service";
import type { RateLimiterMiddleware } from "@/middlewares";
import { asyncHandler } from "@/utils/async-handler";
import { bodyPipe } from "@/middlewares";
import {
  fpOtpSendSchema,
  fpOtpVerifySchema,
  fpMagicLinkSendSchema,
  fpMagicLinkVerifySchema,
  fpResetPasswordSchema
} from "@/validators/schemas/forgot-password";

export class ForgotPasswordController {
  public readonly router = Router();

  constructor(
    private readonly service: ForgotPasswordService,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/otp/send",
      this.rl.forgotPasswordOtpByIp,
      this.rl.forgotPasswordOtpByEmail,
      bodyPipe(fpOtpSendSchema),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/otp/verify",
      this.rl.forgotPasswordOtpByIp,
      bodyPipe(fpOtpVerifySchema),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/magic-link/send",
      this.rl.forgotPasswordMagicLinkByIp,
      this.rl.forgotPasswordMagicLinkByEmail,
      bodyPipe(fpMagicLinkSendSchema),
      asyncHandler(this.sendMagicLink)
    );

    this.router.post(
      "/magic-link/verify",
      this.rl.forgotPasswordMagicLinkByIp,
      bodyPipe(fpMagicLinkVerifySchema),
      asyncHandler(this.verifyMagicLink)
    );

    this.router.post(
      "/reset",
      this.rl.forgotPasswordResetByIp,
      bodyPipe(fpResetPasswordSchema),
      asyncHandler(this.resetPassword)
    );
  }

  private sendOtp = async (req: FPOtpSendRequest): Promise<HandlerResult> => {
    const { data, message } = await this.service.sendOtp(req);
    return { data, message };
  };

  private verifyOtp = async (
    req: FPOtpVerifyRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.verifyOtp(req);
    return { data, message };
  };

  private sendMagicLink = async (
    req: FPMagicLinkSendRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.sendMagicLink(req);
    return { data, message };
  };

  private verifyMagicLink = async (
    req: FPMagicLinkVerifyRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.verifyMagicLink(req);
    return { data, message };
  };

  private resetPassword = async (
    req: FPResetPasswordRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.resetPassword(req);
    return { data, message };
  };
}
