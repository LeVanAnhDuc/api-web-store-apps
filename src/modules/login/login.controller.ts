import { Router } from "express";
import type { Response, NextFunction } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import type { HandlerResult } from "@/types/http";
import type { LoginService } from "./login.service";
import type { RateLimiterMiddleware } from "@/middlewares/common/rate-limiter.middleware";
import { asyncHandler } from "@/utils/async-handler";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";
import { bodyPipe } from "@/middlewares";
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/validators/schemas/login";
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
    _res: Response,
    _next: NextFunction
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.passwordLogin(req);
    const { refreshToken, ...responseData } = data;

    return {
      data: responseData,
      message,
      cookies: refreshToken
        ? [
            {
              name: REFRESH_TOKEN,
              value: refreshToken,
              options: REFRESH_TOKEN_COOKIE_OPTIONS
            }
          ]
        : undefined
    };
  };

  private sendOtp = async (req: OtpSendRequest): Promise<HandlerResult> => {
    const { data, message } = await this.service.sendOtp(req);
    return { data, message };
  };

  private verifyOtp = async (
    req: OtpVerifyRequest,
    _res: Response,
    _next: NextFunction
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.verifyOtp(req);
    const { refreshToken, ...responseData } = data;

    return {
      data: responseData,
      message,
      cookies: refreshToken
        ? [
            {
              name: REFRESH_TOKEN,
              value: refreshToken,
              options: REFRESH_TOKEN_COOKIE_OPTIONS
            }
          ]
        : undefined
    };
  };

  private sendMagicLink = async (
    req: MagicLinkSendRequest
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.sendMagicLink(req);
    return { data, message };
  };

  private verifyMagicLink = async (
    req: MagicLinkVerifyRequest,
    _res: Response,
    _next: NextFunction
  ): Promise<HandlerResult> => {
    const { data, message } = await this.service.verifyMagicLink(req);
    const { refreshToken, ...responseData } = data;

    return {
      data: responseData,
      message,
      cookies: refreshToken
        ? [
            {
              name: REFRESH_TOKEN,
              value: refreshToken,
              options: REFRESH_TOKEN_COOKIE_OPTIONS
            }
          ]
        : undefined
    };
  };
}
