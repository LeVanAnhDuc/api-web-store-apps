// libs
import type { Response } from "express";
// types
import type { LoginRequest } from "@/shared/types/modules/login";
// services
import { login } from "@/modules/login/service";
// responses
import { OkSuccess } from "@/core/responses/success";
// utils
import { asyncHandler } from "@/core/utils/async-handler";
// configs
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from "@/core/configs/cookie";

export const loginController = asyncHandler(
  async (req: LoginRequest, res: Response): Promise<void> => {
    const { data, message } = await login(req);

    // Extract refresh token and set as httpOnly cookie
    const { refreshToken, ...responseData } = data;

    if (refreshToken) {
      res.cookie(
        COOKIE_NAMES.REFRESH_TOKEN,
        refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      );
    }

    // Send response without refresh token (it's in cookie now)
    new OkSuccess({ data: responseData, message }).send(req, res);
  }
);
