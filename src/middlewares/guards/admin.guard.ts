// types
import type { Request, Response, NextFunction } from "express";
// config
import { ForbiddenError } from "@/config/responses/error";
// others
import { AUTHENTICATION_ROLES } from "@/constants/modules/authentication";

export const adminGuard = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const { t } = req;

    if (!req.user) {
      throw new ForbiddenError(t("common:errors.forbidden"));
    }

    if (req.user.roles !== AUTHENTICATION_ROLES.ADMIN) {
      throw new ForbiddenError(t("common:errors.forbidden"));
    }

    next();
  } catch (error) {
    next(error);
  }
};
