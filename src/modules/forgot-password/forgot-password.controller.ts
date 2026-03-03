import { Router } from "express";
import type { Response } from "express";
import type {
  FPOtpSendRequest,
  FPOtpVerifyRequest,
  FPMagicLinkSendRequest,
  FPMagicLinkVerifyRequest,
  FPResetPasswordRequest
} from "@/types/modules/forgot-password";
import type { ForgotPasswordService } from "./forgot-password.service";
import type { RateLimiterMiddleware } from "@/middlewares/rate-limiter";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
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
      validate(fpOtpSendSchema, "body"),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/otp/verify",
      this.rl.forgotPasswordOtpByIp,
      validate(fpOtpVerifySchema, "body"),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/magic-link/send",
      this.rl.forgotPasswordMagicLinkByIp,
      this.rl.forgotPasswordMagicLinkByEmail,
      validate(fpMagicLinkSendSchema, "body"),
      asyncHandler(this.sendMagicLink)
    );

    this.router.post(
      "/magic-link/verify",
      this.rl.forgotPasswordMagicLinkByIp,
      validate(fpMagicLinkVerifySchema, "body"),
      asyncHandler(this.verifyMagicLink)
    );

    this.router.post(
      "/reset",
      this.rl.forgotPasswordResetByIp,
      validate(fpResetPasswordSchema, "body"),
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
