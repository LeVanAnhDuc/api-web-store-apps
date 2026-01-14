import type { Request } from "express";

/**
 * Logout request type (simplified - no session management)
 */
export type LogoutRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>
>;
