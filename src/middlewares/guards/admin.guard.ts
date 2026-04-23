// types
import type { Request, Response, NextFunction } from "express";
// common
import { ForbiddenError } from "@/common/exceptions";
// modules
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";
// others
import { ERROR_CODES } from "@/constants/error-code";

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
