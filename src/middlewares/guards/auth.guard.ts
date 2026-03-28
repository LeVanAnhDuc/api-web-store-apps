import type { Request } from "express";
import type { CanActivate } from "@/core/common";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import { UnauthorizedError } from "@/config/responses/error";
import { verifyAccessToken } from "@/utils/token";

export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthenticationService) {}

  async canActivate(req: Request): Promise<boolean> {
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
    const auth = await this.authService.findById(authId);

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

    return true;
  }
}
