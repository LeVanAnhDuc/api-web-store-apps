import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { CanActivate } from "@/core/interfaces/can-activate.interface";
import { ForbiddenError } from "@/config/responses/error";
import { AUTHENTICATION_ROLES } from "@/constants/enums";

export class AdminGuard implements CanActivate {
  canActivate(req: Request): boolean {
    const { t } = req;

    if (!req.user) {
      throw new ForbiddenError(t("common:errors.forbidden"));
    }

    if (req.user.roles !== AUTHENTICATION_ROLES.ADMIN) {
      throw new ForbiddenError(t("common:errors.forbidden"));
    }

    return true;
  }

  get middleware(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        this.canActivate(req);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
