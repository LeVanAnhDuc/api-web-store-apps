import type { Response } from "express";
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest
} from "@/modules/login/types";
import {
  passwordLoginService,
  sendLoginOtpService,
  verifyLoginOtpService,
  sendMagicLinkService,
  verifyMagicLinkService
} from "@/modules/login/service";
import { OkSuccess } from "@/infra/responses/success";
import { asyncHandler } from "@/infra/utils/async-handler";
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from "@/infra/configs/cookie";

export const loginController = asyncHandler(
  async (req: PasswordLoginRequest, res: Response): Promise<void> => {
    const { data, message } = await passwordLoginService(req);

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
    const { data, message } = await sendLoginOtpService(req);
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
    const { data, message } = await sendMagicLinkService(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

export const verifyMagicLinkController = asyncHandler(
  async (req: MagicLinkVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyMagicLinkService(req);

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
