// types
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// utils
import { verifyAccessToken } from "@/utils/token";

export const optionalAuthGuard =
  (authService: AuthenticationService): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
      }

      const token = authHeader.substring(7);

      if (!token) {
        return next();
      }

      const payload = verifyAccessToken<JwtTokenPayload>(token);

      if (!payload || !payload.userId) {
        return next();
      }

      const authId = payload.authId || payload.userId;
      const auth = await authService.findById(authId);

      if (!auth) {
        return next();
      }

      if (
        auth.passwordChangedAt &&
        payload.iat &&
        payload.iat < Math.floor(auth.passwordChangedAt.getTime() / 1000)
      ) {
        return next();
      }

      req.user = {
        userId: payload.userId,
        authId,
        email: payload.email || "",
        roles: payload.roles || "user",
        fullName: payload.fullName || ""
      };

      next();
    } catch {
      next();
    }
  };
