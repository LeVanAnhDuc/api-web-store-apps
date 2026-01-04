/**
 * Token Refresh Service
 * Use Case: User refreshes access token using refresh token
 *
 * Business Flow:
 * 1. Extract refresh token from HTTP-only cookie
 * 2. Verify refresh token JWT
 * 3. Generate new access token and id token
 *
 * Security:
 * - Refresh token stored in HTTP-only cookie (not accessible by JS)
 * - JWT verification ensures token validity and expiry
 * - Simplified: No session storage lookup
 */

// types
import type {
  RefreshTokenRequest,
  RefreshTokenResponse
} from "@/shared/types/modules/login";

// errors
import { UnauthorizedError, ForbiddenError } from "@/core/responses/error";

// helpers
import {
  verifyRefreshToken,
  generateAccessToken,
  generateResetIdToken
} from "@/core/helpers/jwt";

// utils
import { Logger } from "@/core/utils/logger";

// constants
import { TOKEN_EXPIRY } from "@/core/configs/jwt";

// =============================================================================
// Main Service
// =============================================================================

export const refreshAccessToken = async (
  req: RefreshTokenRequest
): Promise<Partial<ResponsePattern<RefreshTokenResponse>>> => {
  const { t } = req;

  // 1. Get refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    Logger.warn("Token refresh failed - no refresh token in cookie");
    throw new UnauthorizedError(t("login:errors.refreshTokenRequired"));
  }

  // 2. Verify refresh token JWT
  let tokenPayload: {
    userId: string;
    authId: string;
    email: string;
    roles: string;
  };

  try {
    tokenPayload = verifyRefreshToken(refreshToken);
  } catch (error) {
    Logger.warn("Token refresh failed - invalid refresh token", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }

  // 3. Generate new access token and id token
  const newTokenPayload = {
    userId: tokenPayload.userId,
    authId: tokenPayload.authId,
    email: tokenPayload.email,
    roles: tokenPayload.roles
  };

  const newAccessToken = generateAccessToken(newTokenPayload);
  const newIdToken = generateResetIdToken(newTokenPayload);

  Logger.info("Token refresh successful", {
    userId: tokenPayload.userId
  });

  return {
    message: t("login:success.tokenRefreshed"),
    data: {
      accessToken: newAccessToken,
      idToken: newIdToken,
      expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
    }
  };
};
