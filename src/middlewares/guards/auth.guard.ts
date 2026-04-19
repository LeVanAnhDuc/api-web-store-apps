// types
import type { RequestHandler } from "express";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { verifyAccessToken } from "@/utils/token";

export const authGuard: RequestHandler = (req, _res, next) => {
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
