/**
 * Logout & Session Management Controller
 * Handles HTTP request/response for logout and session management endpoints
 * Delegates business logic to service layer
 */

// libs
import type { Request, Response } from "express";

// types
import type {
  GetSessionsRequest,
  LogoutRequest,
  RevokeSessionRequest
} from "@/shared/types/modules/logout";

// services
import {
  getUserSessions,
  logout,
  revokeUserSession,
  revokeAllOtherSessions,
  revokeAllSessions
} from "@/modules/logout/service";

// responses
import { OkSuccess } from "@/core/responses/success";

// utils
import { asyncHandler } from "@/core/utils/async-handler";

// configs
import { COOKIE_NAMES } from "@/core/configs/cookie";

// =============================================================================
// Get Sessions
// =============================================================================

/**
 * GET /auth/sessions
 * Get all active sessions for current user
 */
export const getSessionsController = asyncHandler(
  async (req: GetSessionsRequest, res: Response): Promise<void> => {
    const { data, message } = await getUserSessions(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

// =============================================================================
// Logout
// =============================================================================

/**
 * POST /auth/logout
 * Logout current session (revoke current session)
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

// =============================================================================
// Revoke Sessions
// =============================================================================

/**
 * DELETE /auth/sessions/:sessionId
 * Revoke a specific session (logout from specific device)
 */
export const revokeSessionController = asyncHandler(
  async (req: RevokeSessionRequest, res: Response): Promise<void> => {
    const { data, message } = await revokeUserSession(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * DELETE /auth/sessions/others
 * Revoke all other sessions (logout from all other devices)
 */
export const revokeAllOtherSessionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await revokeAllOtherSessions(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * DELETE /auth/sessions
 * Revoke all sessions (logout from all devices including current)
 */
export const revokeAllSessionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { data, message } = await revokeAllSessions(req);

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
