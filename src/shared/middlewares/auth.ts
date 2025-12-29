/**
 * Authentication Middleware
 * Verifies JWT access tokens and attaches user payload to request
 */

// libs
import type { Request, Response, NextFunction } from "express";

// errors
import { UnauthorizedError, ForbiddenError } from "@/core/responses/error";

// helpers
import { verifyAccessToken } from "@/core/helpers/jwt";

// repository
import { findSessionById } from "@/modules/session/repository";

// utils
import { asyncHandler } from "@/core/utils/async-handler";

/**
 * JWT payload structure for access tokens
 */
interface JwtTokenPayload {
  userId: string;
  authId: string;
  email: string;
  roles: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Verifies the access token and attaches user to request
 *
 * Usage:
 * ```
 * router.get("/protected", authenticate, controller);
 * ```
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { t } = req;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    if (!token) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    // Verify token
    const payload = verifyAccessToken<JwtTokenPayload>(token);

    if (!payload || !payload.userId || !payload.sessionId) {
      throw new UnauthorizedError(t("common:errors.invalidToken"));
    }

    // Attach user payload to request
    req.user = {
      userId: payload.userId,
      authId: payload.authId || payload.userId,
      email: payload.email || "",
      roles: payload.roles || "user",
      sessionId: payload.sessionId
    };

    next();
  }
);

/**
 * Authentication middleware with session validation
 * Verifies token AND checks if session is still valid (not revoked)
 *
 * Use this for sensitive operations where session validity matters
 */
export const authenticateWithSession = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { t } = req;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    // Verify token
    const payload = verifyAccessToken<JwtTokenPayload>(token);

    if (!payload || !payload.userId || !payload.sessionId) {
      throw new UnauthorizedError(t("common:errors.invalidToken"));
    }

    // Verify session is still valid
    const session = await findSessionById(payload.sessionId);

    if (!session) {
      throw new ForbiddenError(t("login:errors.sessionNotFound"));
    }

    if (session.isRevoked) {
      throw new ForbiddenError(t("login:errors.sessionRevoked"));
    }

    if (session.expiresAt < new Date()) {
      throw new ForbiddenError(t("login:errors.sessionExpired"));
    }

    // Attach user payload to request
    req.user = {
      userId: payload.userId,
      authId: payload.authId || payload.userId,
      email: payload.email || "",
      roles: payload.roles || "user",
      sessionId: payload.sessionId
    };

    next();
  }
);
