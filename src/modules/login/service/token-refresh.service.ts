/**
 * Token Refresh Service
 * Use Case: User refreshes access token using refresh token
 *
 * Business Flow:
 * 1. Extract refresh token from HTTP-only cookie
 * 2. Verify refresh token JWT
 * 3. Find session and verify refresh token hash
 * 4. Generate new access token and id token
 * 5. Update session last active
 *
 * Security:
 * - Refresh token stored in HTTP-only cookie (not accessible by JS)
 * - Refresh token hash stored in session (not the token itself)
 * - Same refresh token used until expiry or logout
 */

// libs
import * as bcrypt from "bcrypt";
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

// repositories
import {
  findSessionWithToken,
  updateLastActive
} from "@/modules/session/repository";

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
    sessionId?: string;
  };

  try {
    tokenPayload = verifyRefreshToken(refreshToken);
  } catch (error) {
    Logger.warn("Token refresh failed - invalid refresh token", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }

  const { sessionId } = tokenPayload;

  if (!sessionId) {
    Logger.warn("Token refresh failed - no session ID in token");
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }

  // 3. Find session and verify refresh token hash
  const session = await findSessionWithToken(sessionId);

  if (!session) {
    Logger.warn("Token refresh failed - session not found", { sessionId });
    throw new ForbiddenError(t("login:errors.sessionNotFound"));
  }

  if (session.isRevoked) {
    Logger.warn("Token refresh failed - session revoked", { sessionId });
    throw new ForbiddenError(t("login:errors.sessionRevoked"));
  }

  if (session.expiresAt < new Date()) {
    Logger.warn("Token refresh failed - session expired", { sessionId });
    throw new ForbiddenError(t("login:errors.sessionExpired"));
  }

  // Verify refresh token hash
  const isValidToken = await bcrypt.compare(
    refreshToken,
    session.refreshTokenHash
  );

  if (!isValidToken) {
    Logger.warn("Token refresh failed - refresh token mismatch", { sessionId });
    throw new ForbiddenError(t("login:errors.invalidRefreshToken"));
  }

  // 4. Generate new access token and id token
  const newTokenPayload = {
    userId: tokenPayload.userId,
    authId: tokenPayload.authId,
    email: tokenPayload.email,
    roles: tokenPayload.roles,
    sessionId
  };

  const newAccessToken = generateAccessToken(newTokenPayload);
  const newIdToken = generateResetIdToken(newTokenPayload);

  // 5. Update session last active
  await updateLastActive(sessionId);

  Logger.info("Token refresh successful", {
    sessionId,
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
