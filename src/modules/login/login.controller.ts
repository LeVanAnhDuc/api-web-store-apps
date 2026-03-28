// libs
import { Router } from "express";
import type { Response, NextFunction } from "express";

// types
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import type { LoginService } from "./login.service";
import type { RateLimiterMiddleware } from "@/middlewares";

// config
import { OkSuccess } from "@/config/responses/success";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";

// middlewares
import { asyncHandler } from "@/utils/async-handler";
import { bodyPipe } from "@/middlewares";

// validators
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/validators/schemas/login";

// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class LoginController {
  public readonly router = Router();

  constructor(
    private readonly service: LoginService,
    private readonly rl: RateLimiterMiddleware
  ) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      this.rl.loginByIp,
      bodyPipe(loginSchema),
      asyncHandler(this.login)
    );

    this.router.post(
      "/otp/send",
      this.rl.loginOtpByIp,
      this.rl.loginOtpByEmail,
      bodyPipe(otpSendSchema),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/otp/verify",
      this.rl.loginByIp,
      bodyPipe(otpVerifySchema),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/magic-link/send",
      this.rl.magicLinkByIp,
      this.rl.magicLinkByEmail,
      bodyPipe(magicLinkSendSchema),
      asyncHandler(this.sendMagicLink)
    );

    this.router.post(
      "/magic-link/verify",
      this.rl.loginByIp,
      bodyPipe(magicLinkVerifySchema),
      asyncHandler(this.verifyMagicLink)
    );
  }

  private login = async (
    req: PasswordLoginRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { data, message } = await this.service.passwordLogin(req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({ data: responseData, message }).send(req, res);
  };

  private sendOtp = async (
    req: OtpSendRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private verifyOtp = async (
    req: OtpVerifyRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { data, message } = await this.service.verifyOtp(req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({ data: responseData, message }).send(req, res);
  };

  private sendMagicLink = async (
    req: MagicLinkSendRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.sendMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  };

  private verifyMagicLink = async (
    req: MagicLinkVerifyRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { data, message } = await this.service.verifyMagicLink(req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({ data: responseData, message }).send(req, res);
  };
}
