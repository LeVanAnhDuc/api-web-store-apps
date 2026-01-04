import type { Response } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest,
  RefreshTokenRequest
} from "@/shared/types/modules/login";
import {
  passwordLogin,
  sendLoginOtp,
  verifyLoginOtpService,
  sendMagicLink,
  verifyMagicLink,
  refreshAccessToken
} from "@/modules/login/service";
import { OkSuccess } from "@/core/responses/success";
import { asyncHandler } from "@/core/utils/async-handler";
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from "@/core/configs/cookie";

export const loginController = asyncHandler(
  async (req: PasswordLoginRequest, res: Response): Promise<void> => {
    const { data, message } = await passwordLogin(req);

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
    const { data, message } = await sendLoginOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyOtpController = asyncHandler(
  async (req: OtpVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyLoginOtpService(req);

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
    const { data, message } = await sendMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyMagicLinkController = asyncHandler(
  async (req: MagicLinkVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyMagicLink(req);

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

export const refreshTokenController = asyncHandler(
  async (req: RefreshTokenRequest, res: Response): Promise<void> => {
    const { data, message } = await refreshAccessToken(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
