// types
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { verifyAccessToken } from "@/utils/token";

export const authGuard =
  (authService: AuthenticationService): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { t } = req;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError(
          t("common:errors.unauthorized"),
          ERROR_CODES.AUTH_MISSING_TOKEN
        );
      }

      const token = authHeader.substring(7);

      if (!token) {
        throw new UnauthorizedError(
          t("common:errors.unauthorized"),
          ERROR_CODES.AUTH_MISSING_TOKEN
        );
      }

      const payload = verifyAccessToken(token);

      if (!payload || !payload.sub || !payload.authId) {
        throw new UnauthorizedError(
          t("common:errors.invalidToken"),
          ERROR_CODES.AUTH_INVALID_TOKEN
        );
      }

      const auth = await authService.findById(payload.authId);

      if (!auth) {
        throw new UnauthorizedError(
          t("common:errors.unauthorized"),
          ERROR_CODES.AUTH_NOT_FOUND
        );
      }

      if (
        auth.passwordChangedAt &&
        payload.iat &&
        payload.iat < Math.floor(auth.passwordChangedAt.getTime() / 1000)
      ) {
        throw new UnauthorizedError(
          t("forgotPassword:errors.passwordChangedPleaseLogin"),
          ERROR_CODES.AUTH_PASSWORD_CHANGED
        );
      }

      req.user = {
        sub: payload.sub,
        authId: payload.authId,
        roles: payload.roles
      };

      next();
    } catch (error) {
      next(error);
    }
  };
