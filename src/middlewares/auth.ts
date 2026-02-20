import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/infra/responses/error";
import { JsonWebTokenService } from "@/app/services/JsonWebTokenService";
import { asyncHandler } from "@/utils/async-handler";

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { t } = req;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError(t("common:errors.unauthorized"));
    }

    const payload =
      JsonWebTokenService.verifyAccessToken<JwtTokenPayload>(token);

    if (!payload || !payload.userId) {
      throw new UnauthorizedError(t("common:errors.invalidToken"));
    }

    req.user = {
      userId: payload.userId,
      authId: payload.authId || payload.userId,
      email: payload.email || "",
      roles: payload.roles || "user"
    };

    next();
  }
);
