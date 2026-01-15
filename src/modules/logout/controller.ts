/**
 * Logout Controller (Simplified)
 * Handles logout endpoint - clears refresh token cookie
 */

import type { Response } from "express";

import type { LogoutRequest } from "@/modules/logout/types";

import { logout } from "@/modules/logout/service";

import { OkSuccess } from "@/infra/responses/success";

import { asyncHandler } from "@/infra/utils/async-handler";

import { COOKIE_NAMES } from "@/infra/configs/cookie";

/**
 * POST /auth/logout
 * Logout - clear refresh token cookie
 */
export const logoutController = asyncHandler(
  async (req: LogoutRequest, res: Response): Promise<void> => {
    const { data, message } = await logout(req);

    // Clear refresh token cookie
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new OkSuccess({ data, message }).send(req, res);
  }
);
