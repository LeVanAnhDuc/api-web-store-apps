import type { Response } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import { loginService } from "@/modules/login/service/login.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";
import { COOKIE_NAMES } from "@/constants/infrastructure";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/configurations/cookie";

class LoginController {
  constructor(private readonly service: typeof loginService) {}

  login = asyncHandler(
    async (req: PasswordLoginRequest, res: Response): Promise<void> => {
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
    }
  );

  sendOtp = asyncHandler(
    async (req: OtpSendRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.sendOtp(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  verifyOtp = asyncHandler(
    async (req: OtpVerifyRequest, res: Response): Promise<void> => {
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
    }
  );

  sendMagicLink = asyncHandler(
    async (req: MagicLinkSendRequest, res: Response): Promise<void> => {
      const { data, message } = await this.service.sendMagicLink(req);
      new OkSuccess({ data, message }).send(req, res);
    }
  );

  verifyMagicLink = asyncHandler(
    async (req: MagicLinkVerifyRequest, res: Response): Promise<void> => {
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
    }
  );
}

export const loginController = new LoginController(loginService);
