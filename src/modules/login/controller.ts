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

export const loginController = asyncHandler(
  async (req: PasswordLoginRequest, res: Response): Promise<void> => {
    const { data, message } = await loginService.passwordLogin(req);

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

export const sendOtpController = asyncHandler(
  async (req: OtpSendRequest, res: Response): Promise<void> => {
    const { data, message } = await loginService.sendOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyOtpController = asyncHandler(
  async (req: OtpVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await loginService.verifyOtp(req);

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

export const sendMagicLinkController = asyncHandler(
  async (req: MagicLinkSendRequest, res: Response): Promise<void> => {
    const { data, message } = await loginService.sendMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyMagicLinkController = asyncHandler(
  async (req: MagicLinkVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await loginService.verifyMagicLink(req);

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
