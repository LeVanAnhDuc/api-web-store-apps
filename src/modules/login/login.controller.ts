// types
import type { Response } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "./types";
import type { LoginService } from "./services";
// config
import { OkSuccess } from "@/config/responses/success";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";
// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class LoginController {
  constructor(private readonly service: LoginService) {}

  login = async (req: PasswordLoginRequest, res: Response): Promise<void> => {
    const data = await this.service.passwordLogin(req.body, req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({
      data: responseData,
      message: "login:success.loginSuccessful"
    }).send(req, res);
  };

  sendOtp = async (req: OtpSendRequest, res: Response): Promise<void> => {
    const data = await this.service.sendOtp(req.body, req);
    new OkSuccess({ data, message: "login:success.otpSent" }).send(req, res);
  };

  verifyOtp = async (req: OtpVerifyRequest, res: Response): Promise<void> => {
    const data = await this.service.verifyOtp(req.body, req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({
      data: responseData,
      message: "login:success.loginSuccessful"
    }).send(req, res);
  };

  sendMagicLink = async (
    req: MagicLinkSendRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.sendMagicLink(req.body, req);
    new OkSuccess({ data, message: "login:success.magicLinkSent" }).send(
      req,
      res
    );
  };

  verifyMagicLink = async (
    req: MagicLinkVerifyRequest,
    res: Response
  ): Promise<void> => {
    const data = await this.service.verifyMagicLink(req.body, req);
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    }

    new OkSuccess({
      data: responseData,
      message: "login:success.loginSuccessful"
    }).send(req, res);
  };
}
