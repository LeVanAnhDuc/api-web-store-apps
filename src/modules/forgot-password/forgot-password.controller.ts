// libs
import { Router } from "express";
import type { Response } from "express";

// types
import type {
  FPOtpSendRequest,
  FPOtpVerifyRequest,
  FPMagicLinkSendRequest,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest
} from "@/types/modules/forgot-password";
import type { ForgotPasswordService } from "./forgot-password.service";
import type { RateLimiterMiddleware } from "@/middlewares";

// config
import { OkSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe } from "@/middlewares";

// validators
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

  private sendOtp = async (
    req: FPOtpSendRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private verifyOtp = async (
    req: FPOtpVerifyRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.verifyOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private sendMagicLink = async (
    req: FPMagicLinkSendRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.sendMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private verifyMagicLink = async (
    req: FPMagicLinkVerifyRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.verifyMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private resetPassword = async (
    req: FPResetPasswordRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.resetPassword(req);
    new OkSuccess({ data, message }).send(req, res);
  };
}
