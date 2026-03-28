import { Router } from "express";
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/types/modules/signup";
import type { HandlerResult } from "@/types/http";
import type { SignupService } from "./signup.service";
import { STATUS_CODES } from "@/config/http";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody, validateParams } from "@/middlewares";
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
      validateBody(sendOtpSchema),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/verify-otp",
      validateBody(verifyOtpSchema),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/resend-otp",
      this.rl.signupOtpByIp,
      this.rl.signupOtpByEmail,
      validateBody(resendOtpSchema),
      asyncHandler(this.resendOtp)
    );

    this.router.post(
      "/complete",
      validateBody(completeSignupSchema),
      asyncHandler(this.completeSignup)
    );

    this.router.get(
      "/check-email/:email",
      this.rl.checkEmailByIp,
      validateParams(checkEmailSchema),
      asyncHandler(this.checkEmail)
    );
  }

  private sendOtp = async (req: SendOtpRequest): Promise<HandlerResult> => {
    const { data, message } = await this.service.sendOtp(req);
    return { data, message };
  };

  private verifyOtp = async (req: VerifyOtpRequest): Promise<HandlerResult> => {
    const { data, message } = await this.service.verifyOtp(req);
    return { data, message };
  };

  private resendOtp = async (req: ResendOtpRequest): Promise<HandlerResult> => {
    const { data, message } = await this.service.resendOtp(req);
    return { data, message };
  };

  private completeSignup = async (
    req: CompleteSignupRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.completeSignup(req);
    return { data, message, statusCode: STATUS_CODES.CREATED };
  };

  private checkEmail = async (
    req: CheckEmailRequest
  ): Promise<HandlerResult> => {
    const { data } = await this.service.checkEmail(req);
    return { data };
  };
}
