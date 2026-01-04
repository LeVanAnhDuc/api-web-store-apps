/**
 * Authentication Middleware (Simplified)
 * Verifies JWT access tokens and attaches user payload to request
 * No session validation - stateless JWT auth
 */

// libs
import type { Request, Response, NextFunction } from "express";

// errors
import { UnauthorizedError } from "@/core/responses/error";

// helpers
import { verifyAccessToken } from "@/core/helpers/jwt";

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

    if (!payload || !payload.userId) {
      throw new UnauthorizedError(t("common:errors.invalidToken"));
    }

    // Attach user payload to request
    req.user = {
      userId: payload.userId,
      authId: payload.authId || payload.userId,
      email: payload.email || "",
      roles: payload.roles || "user"
    };

    next();
  }
);
