import type { Request } from "express";
import type { CanActivate } from "@/core/common";
import { ForbiddenError } from "@/config/responses/error";
import { AUTHENTICATION_ROLES } from "@/constants/modules/authentication";

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
}
