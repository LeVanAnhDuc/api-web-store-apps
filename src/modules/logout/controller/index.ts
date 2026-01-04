/**
 * Logout Controller (Simplified)
 * Handles logout endpoint - clears refresh token cookie
 */

// libs
import type { Response } from "express";

// types
import type { LogoutRequest } from "@/shared/types/modules/logout";

// services
import { logout } from "@/modules/logout/service";

// responses
import { OkSuccess } from "@/core/responses/success";

// utils
import { asyncHandler } from "@/core/utils/async-handler";

// configs
import { COOKIE_NAMES } from "@/core/configs/cookie";

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
