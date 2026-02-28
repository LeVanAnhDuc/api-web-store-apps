import { Router } from "express";
import type { Response } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import type { LoginService } from "./login.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/configurations/cookie";
import { validate } from "@/validators/middleware";
import { getRateLimiterMiddleware } from "@/loaders/rate-limiter.loader";
import {
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema
} from "@/validators/schemas/login";

export class LoginController {
  public readonly router = Router();

  constructor(private readonly service: LoginService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
      validate(loginSchema, "body"),
      asyncHandler(this.login)
    );

    this.router.post(
      "/otp/send",
      (req, res, next) =>
        getRateLimiterMiddleware().loginOtpByIp(req, res, next),
      (req, res, next) =>
        getRateLimiterMiddleware().loginOtpByEmail(req, res, next),
      validate(otpSendSchema, "body"),
      asyncHandler(this.sendOtp)
    );

    this.router.post(
      "/otp/verify",
      (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
      validate(otpVerifySchema, "body"),
      asyncHandler(this.verifyOtp)
    );

    this.router.post(
      "/magic-link/send",
      (req, res, next) =>
        getRateLimiterMiddleware().magicLinkByIp(req, res, next),
      (req, res, next) =>
        getRateLimiterMiddleware().magicLinkByEmail(req, res, next),
      validate(magicLinkSendSchema, "body"),
      asyncHandler(this.sendMagicLink)
    );

    this.router.post(
      "/magic-link/verify",
      (req, res, next) => getRateLimiterMiddleware().loginByIp(req, res, next),
      validate(magicLinkVerifySchema, "body"),
      asyncHandler(this.verifyMagicLink)
    );
  }

  private login = async (
    req: PasswordLoginRequest,
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.passwordLogin(req);

    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
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
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.verifyOtp(req);

    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
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
    res: Response
  ): Promise<void> => {
    const { data, message } = await this.service.verifyMagicLink(req);

    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
    }

    new OkSuccess({ data: responseData, message }).send(req, res);
  };
}
