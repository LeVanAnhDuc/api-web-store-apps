// types
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// others
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

      const payload = verifyAccessToken(token);

      if (!payload || !payload.sub || !payload.authId) {
        return next();
      }

      const auth = await authService.findById(payload.authId);

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
        sub: payload.sub,
        authId: payload.authId,
        roles: payload.roles
      };

      next();
    } catch {
      next();
    }
  };
