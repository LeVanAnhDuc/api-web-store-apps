/**
 * Logout Service (Simplified)
 *
 * Use Case: Clear refresh token cookie
 * Since we use stateless JWT auth, logout just means:
 * 1. Clear refresh token cookie from response
 * 2. Client deletes access token from memory
 */

import type { LogoutRequest } from "@/modules/logout/types";

import { Logger } from "@/infra/utils/logger";

/**
 * Logout - Clear refresh token cookie
 */
export const logout = async (
  req: LogoutRequest
): Promise<Partial<ResponsePattern<{ success: boolean }>>> => {
  const { t } = req;
  const userId = req.user?.userId;

  Logger.info("Logout initiated", { userId });

  // Note: Cookie clearing is handled in controller
  // This service just logs the event

  Logger.info("Logout successful", { userId });

  return {
    message: t("logout:success.logoutSuccessful"),
    data: { success: true }
  };
};
