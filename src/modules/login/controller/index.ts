/**
 * Login Controller
 * Handles HTTP request/response for all login-related endpoints
 * Delegates business logic to service layer
 *
 * Note: Session management (logout, revoke) moved to logout module
 */

// libs
import type { Response } from "express";

// types
import type {
  PasswordLoginRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkVerifyRequest,
  RefreshTokenRequest
} from "@/shared/types/modules/login";

// services
import {
  passwordLogin,
  sendLoginOtp,
  verifyLoginOtpService,
  sendMagicLink,
  verifyMagicLink,
  refreshAccessToken
} from "@/modules/login/service";

// responses
import { OkSuccess } from "@/core/responses/success";

// utils
import { asyncHandler } from "@/core/utils/async-handler";

// configs
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from "@/core/configs/cookie";

// =============================================================================
// Password Login
// =============================================================================

/**
 * POST /auth/login
 * Authenticate user with email and password
 */
export const loginController = asyncHandler(
  async (req: PasswordLoginRequest, res: Response): Promise<void> => {
    const { data, message } = await passwordLogin(req);

    // Extract refresh token and set as httpOnly cookie
    const { refreshToken, ...responseData } = data!;

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

// =============================================================================
// OTP Login
// =============================================================================

/**
 * POST /auth/otp/send
 * Send OTP to email for passwordless login
 */
export const sendOtpController = asyncHandler(
  async (req: OtpSendRequest, res: Response): Promise<void> => {
    const { data, message } = await sendLoginOtp(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * POST /auth/otp/verify
 * Verify OTP and authenticate user
 */
export const verifyOtpController = asyncHandler(
  async (req: OtpVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyLoginOtpService(req);

    // Extract refresh token and set as httpOnly cookie
    const { refreshToken, ...responseData } = data!;

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

// =============================================================================
// Magic Link Login
// =============================================================================

/**
 * POST /auth/magic-link/send
 * Send magic link to email for passwordless login
 */
export const sendMagicLinkController = asyncHandler(
  async (req: MagicLinkSendRequest, res: Response): Promise<void> => {
    const { data, message } = await sendMagicLink(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);

/**
 * POST /auth/magic-link/verify
 * Verify magic link and authenticate user
 */
export const verifyMagicLinkController = asyncHandler(
  async (req: MagicLinkVerifyRequest, res: Response): Promise<void> => {
    const { data, message } = await verifyMagicLink(req);

    // Extract refresh token and set as httpOnly cookie
    const { refreshToken, ...responseData } = data!;

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

// =============================================================================
// Token Refresh
// =============================================================================

/**
 * POST /auth/refresh
 * Refresh access token using refresh token from cookie
 */
export const refreshTokenController = asyncHandler(
  async (req: RefreshTokenRequest, res: Response): Promise<void> => {
    const { data, message } = await refreshAccessToken(req);
    new OkSuccess({ data, message }).send(req, res);
  }
);
