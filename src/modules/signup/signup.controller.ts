// libs
import { Router } from "express";
import type { Response } from "express";

// types
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/types/modules/signup";
import type { SignupService } from "./signup.service";
import type { RateLimiterMiddleware } from "@/middlewares";

// config
import { OkSuccess, CreatedSuccess } from "@/config/responses/success";

// utils
import { asyncHandler } from "@/utils/async-handler";

// middlewares
import { bodyPipe, paramsPipe } from "@/middlewares";

// validators
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/validators/schemas/signup";

export class SignupController {
  public readonly router = Router();

  constructor(
    private readonly service: SignupService,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/send-otp",
      this.rl.signupOtpByIp,
      this.rl.signupOtpByEmail,
      bodyPipe(sendOtpSchema),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/verify-otp",
      bodyPipe(verifyOtpSchema),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/resend-otp",
      this.rl.signupOtpByIp,
      this.rl.signupOtpByEmail,
      bodyPipe(resendOtpSchema),
      asyncHandler(this.resendOtp)
    );

    this.router.post(
      "/complete",
      bodyPipe(completeSignupSchema),
      asyncHandler(this.completeSignup)
    );

    this.router.get(
      "/check-email/:email",
      this.rl.checkEmailByIp,
      paramsPipe(checkEmailSchema),
      asyncHandler(this.checkEmail)
    );
  }

  private sendOtp = async (
    req: SendOtpRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private verifyOtp = async (
    req: VerifyOtpRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.verifyOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private resendOtp = async (
    req: ResendOtpRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.resendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private completeSignup = async (
    req: CompleteSignupRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.completeSignup(req);
    new CreatedSuccess({ data, message }).send(req, res);
  };

  private checkEmail = async (
    req: CheckEmailRequest,
    res: Response
  ): Promise<void> => {
    const { data } = await this.service.checkEmail(req);
    new OkSuccess({ data }).send(req, res);
  };
}
