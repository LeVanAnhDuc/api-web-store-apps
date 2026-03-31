// types
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { verifyAccessToken } from "@/utils/token";

export const authGuard =
  (authService: AuthenticationService): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { t } = req;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError(t("common:errors.unauthorized"));
      }

      const token = authHeader.substring(7);

      if (!token) {
        throw new UnauthorizedError(t("common:errors.unauthorized"));
      }

      const payload = verifyAccessToken<JwtTokenPayload>(token);

      if (!payload || !payload.userId) {
        throw new UnauthorizedError(t("common:errors.invalidToken"));
      }

      const authId = payload.authId || payload.userId;
      const auth = await authService.findById(authId);

      if (!auth) {
        throw new UnauthorizedError(t("common:errors.unauthorized"));
      }

      if (
        auth.passwordChangedAt &&
        payload.iat &&
        payload.iat < Math.floor(auth.passwordChangedAt.getTime() / 1000)
      ) {
        throw new UnauthorizedError(
          t("forgotPassword:errors.passwordChangedPleaseLogin")
        );
      }

      req.user = {
        userId: payload.userId,
        authId,
        email: payload.email || "",
        roles: payload.roles || "user"
      };

      next();
    } catch (error) {
      next(error);
    }
  };
