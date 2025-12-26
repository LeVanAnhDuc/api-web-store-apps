import type { Request } from "express";
// types
import type { SessionResponse } from "@/shared/types/modules/session";

/**
 * Login response with tokens
 *
 * Note: refreshToken is included in response but controller
 * extracts it and sets as httpOnly cookie before sending to client
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

/**
 * Extended login response with session info
 */
export interface LoginWithSessionResponse extends LoginResponse {
  session: SessionResponse;
  isNewDevice?: boolean;
  isNewLocation?: boolean;
}

// =============================================================================
// Password Login
// =============================================================================

export interface PasswordLoginBody {
  email: string;
  password: string;
}

export type PasswordLoginRequest = Request<
  Record<string, never>,
  unknown,
  PasswordLoginBody
>;

// =============================================================================
// OTP Login
// =============================================================================

export interface OtpSendBody {
  email: string;
}

export interface OtpVerifyBody {
  email: string;
  otp: string;
}

export interface OtpSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type OtpSendRequest = Request<
  Record<string, never>,
  unknown,
  OtpSendBody
>;

export type OtpVerifyRequest = Request<
  Record<string, never>,
  unknown,
  OtpVerifyBody
>;

// =============================================================================
// Magic Link Login
// =============================================================================

export interface MagicLinkSendBody {
  email: string;
}

export interface MagicLinkVerifyBody {
  email: string;
  token: string;
}

export interface MagicLinkSendResponse {
  success: boolean;
  expiresIn: number;
  cooldown: number;
}

export type MagicLinkSendRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkSendBody
>;

export type MagicLinkVerifyRequest = Request<
  Record<string, never>,
  unknown,
  MagicLinkVerifyBody
>;

// =============================================================================
// Token Refresh
// =============================================================================

export interface RefreshTokenResponse {
  accessToken: string;
  idToken: string;
  expiresIn: number;
}

export type RefreshTokenRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;

// =============================================================================
// Session Management
// =============================================================================

export interface RevokeSessionParams {
  sessionId: string;
}

export type RevokeSessionRequest = Request<
  RevokeSessionParams,
  unknown,
  Record<string, never>
>;

export type GetSessionsRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;

export type LogoutRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;

// =============================================================================
// Account Unlock
// =============================================================================

export interface UnlockRequestBody {
  email: string;
}

export interface UnlockVerifyBody {
  email: string;
  token: string;
}

export type UnlockRequest = Request<
  Record<string, never>,
  unknown,
  UnlockRequestBody
>;

export type UnlockVerifyRequest = Request<
  Record<string, never>,
  unknown,
  UnlockVerifyBody
>;

// =============================================================================
// Backward Compatibility (deprecated)
// =============================================================================

/**
 * @deprecated Use PasswordLoginBody instead
 */
export type LoginBody = PasswordLoginBody;

/**
 * @deprecated Use PasswordLoginRequest instead
 */
export type LoginRequest = PasswordLoginRequest;
