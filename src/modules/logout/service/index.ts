/**
 * Logout & Session Management Services
 *
 * Use Cases:
 * - Get all active sessions for current user
 * - Logout (revoke current session)
 * - Revoke specific session
 * - Revoke all other sessions (logout from all devices except current)
 * - Revoke all sessions (logout from all devices)
 */

// libs
import i18next from "@/i18n";

// types
import type { Request } from "express";
import type { SessionResponse } from "@/shared/types/modules/session";
import type {
  LogoutRequest,
  GetSessionsRequest,
  RevokeSessionRequest
} from "@/shared/types/modules/logout";

// errors
import { NotFoundError, ForbiddenError } from "@/core/responses/error";

// utils
import { Logger } from "@/core/utils/logger";

// repositories
import {
  findActiveSessionsByUserId,
  revokeSession,
  revokeSessionByIdAndUserId,
  revokeAllSessionsByUserId,
  revokeOtherSessions,
  toSessionResponse
} from "@/modules/session/repository";

// constants
import { LOGIN_SESSION_CONFIG } from "@/shared/constants/modules/session";

// =============================================================================
// Get Sessions Service
// =============================================================================

export const getUserSessions = async (
  req: GetSessionsRequest
): Promise<
  Partial<ResponsePattern<{ sessions: SessionResponse[]; total: number }>>
> => {
  const { t } = req;
  const userId = req.user?.userId;
  const currentSessionId = req.user?.sessionId;

  if (!userId) {
    throw new ForbiddenError(t("common:errors.unauthorized"));
  }

  Logger.info("Get user sessions initiated", { userId });

  const sessions = await findActiveSessionsByUserId(userId);

  const sessionResponses = sessions.map((session) =>
    toSessionResponse(session, currentSessionId)
  );

  // Warning if too many sessions
  if (sessions.length >= LOGIN_SESSION_CONFIG.MANY_SESSIONS_WARNING_THRESHOLD) {
    Logger.warn("User has many active sessions", {
      userId,
      sessionCount: sessions.length
    });
  }

  Logger.info("Get user sessions completed", {
    userId,
    sessionCount: sessions.length
  });

  return {
    message: t("logout:success.sessionsRetrieved"),
    data: {
      sessions: sessionResponses,
      total: sessions.length
    }
  };
};

// =============================================================================
// Logout Service (Revoke Current Session)
// =============================================================================

export const logout = async (
  req: LogoutRequest
): Promise<Partial<ResponsePattern<{ success: boolean }>>> => {
  const { t } = req;
  const sessionId = req.user?.sessionId;
  const userId = req.user?.userId;

  if (!sessionId || !userId) {
    throw new ForbiddenError(t("common:errors.unauthorized"));
  }

  Logger.info("Logout initiated", { userId, sessionId });

  const revokedSession = await revokeSession(sessionId);

  if (!revokedSession) {
    Logger.warn("Logout failed - session not found", { sessionId });
    throw new NotFoundError(t("logout:errors.sessionNotFound"));
  }

  Logger.info("Logout successful", { userId, sessionId });

  return {
    message: t("logout:success.logoutSuccessful"),
    data: { success: true }
  };
};

// =============================================================================
// Revoke Specific Session Service
// =============================================================================

export const revokeUserSession = async (
  req: RevokeSessionRequest
): Promise<Partial<ResponsePattern<{ success: boolean }>>> => {
  const { t } = req;
  const { sessionId: targetSessionId } = req.params;
  const userId = req.user?.userId;
  const currentSessionId = req.user?.sessionId;

  if (!userId) {
    throw new ForbiddenError(t("common:errors.unauthorized"));
  }

  Logger.info("Revoke session initiated", {
    userId,
    targetSessionId,
    currentSessionId
  });

  // Don't allow revoking current session through this endpoint
  if (targetSessionId === currentSessionId) {
    Logger.warn("Attempted to revoke current session through revoke endpoint", {
      userId,
      sessionId: targetSessionId
    });
    throw new ForbiddenError(t("logout:errors.useLogoutForCurrentSession"));
  }

  // Revoke session (with ownership check)
  const revokedSession = await revokeSessionByIdAndUserId(
    targetSessionId,
    userId
  );

  if (!revokedSession) {
    Logger.warn("Revoke session failed - session not found or not owned", {
      userId,
      targetSessionId
    });
    throw new NotFoundError(t("logout:errors.sessionNotFound"));
  }

  Logger.info("Revoke session successful", {
    userId,
    revokedSessionId: targetSessionId
  });

  return {
    message: t("logout:success.sessionRevoked"),
    data: { success: true }
  };
};

// =============================================================================
// Revoke All Other Sessions Service
// =============================================================================

export const revokeAllOtherSessions = async (
  req: Request
): Promise<Partial<ResponsePattern<{ revokedCount: number }>>> => {
  const { t, language } = req;
  const userId = req.user?.userId;
  const currentSessionId = req.user?.sessionId;

  if (!userId || !currentSessionId) {
    throw new ForbiddenError(t("common:errors.unauthorized"));
  }

  Logger.info("Revoke all other sessions initiated", {
    userId,
    currentSessionId
  });

  const revokedCount = await revokeOtherSessions(userId, currentSessionId);

  Logger.info("Revoke all other sessions completed", {
    userId,
    revokedCount
  });

  return {
    message: i18next.t("logout:success.allOtherSessionsRevoked", {
      count: revokedCount,
      lng: language
    }),
    data: { revokedCount }
  };
};

// =============================================================================
// Revoke All Sessions Service (Logout from all devices)
// =============================================================================

export const revokeAllSessions = async (
  req: Request
): Promise<Partial<ResponsePattern<{ revokedCount: number }>>> => {
  const { t, language } = req;
  const userId = req.user?.userId;

  if (!userId) {
    throw new ForbiddenError(t("common:errors.unauthorized"));
  }

  Logger.info("Revoke all sessions initiated", { userId });

  const revokedCount = await revokeAllSessionsByUserId(userId);

  Logger.info("Revoke all sessions completed", {
    userId,
    revokedCount
  });

  return {
    message: i18next.t("logout:success.allSessionsRevoked", {
      count: revokedCount,
      lng: language
    }),
    data: { revokedCount }
  };
};
