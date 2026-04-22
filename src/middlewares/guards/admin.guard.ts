// types
import type { Request, Response, NextFunction } from "express";
// config
import { ForbiddenError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";

export const adminGuard = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const { t } = req;

    if (!req.user) {
      throw new ForbiddenError(
        t("common:errors.forbidden"),
        ERROR_CODES.AUTH_ADMIN_ONLY
      );
    }

    if (req.user.roles !== AUTHENTICATION_ROLES.ADMIN) {
      throw new ForbiddenError(
        t("common:errors.forbidden"),
        ERROR_CODES.AUTH_ADMIN_ONLY
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
