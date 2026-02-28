import { Router } from "express";
import type { Response } from "express";
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  CompleteSignupRequest,
  CheckEmailRequest
} from "@/types/modules/signup";
import type { SignupService } from "./signup.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  sendOtpSchema,
  resendOtpSchema,
  verifyOtpSchema,
  completeSignupSchema,
  checkEmailSchema
} from "@/validators/schemas/signup";

export class SignupController {
  public readonly router = Router();

  constructor(private readonly service: SignupService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/send-otp",
      (req, res, next) =>
        getRateLimiterMiddleware().signupOtpByIp(req, res, next),
      (req, res, next) =>
        getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
      validate(sendOtpSchema, "body"),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/verify-otp",
      validate(verifyOtpSchema, "body"),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/resend-otp",
      (req, res, next) =>
        getRateLimiterMiddleware().signupOtpByIp(req, res, next),
      (req, res, next) =>
        getRateLimiterMiddleware().signupOtpByEmail(req, res, next),
      validate(resendOtpSchema, "body"),
      asyncHandler(this.resendOtp)
    );

    this.router.post(
      "/complete",
      validate(completeSignupSchema, "body"),
      asyncHandler(this.completeSignup)
    );

    this.router.get(
      "/check-email/:email",
      (req, res, next) =>
        getRateLimiterMiddleware().checkEmailByIp(req, res, next),
      validate(checkEmailSchema, "params"),
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
    new OkSuccess({ data, message }).send(req, res);
  };

  private checkEmail = async (
    req: CheckEmailRequest,
    res: Response
  ): Promise<void> => {
    const { data } = await this.service.checkEmail(req);
    new OkSuccess({ data }).send(req, res);
  };
}
