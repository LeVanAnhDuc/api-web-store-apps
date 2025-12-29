import type { Request } from "express";

// =============================================================================
// Session Management
// =============================================================================

export interface RevokeSessionParams {
  sessionId: string;
  [key: string]: string;
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

export type RevokeAllSessionsRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;
