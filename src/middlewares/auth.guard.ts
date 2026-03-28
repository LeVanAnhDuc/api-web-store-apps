import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { CanActivate } from "@/core/interfaces/can-activate.interface";
import type { AuthenticationRepository } from "@/modules/authen/repositories/authentication.repository";
import { UnauthorizedError } from "@/config/responses/error";
import { verifyAccessToken } from "@/utils/token";

export class AuthGuard implements CanActivate {
  constructor(private readonly authRepo: AuthenticationRepository) {}

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
    const auth = await this.authRepo.findById(authId);

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

  get middleware(): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await this.canActivate(req);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
