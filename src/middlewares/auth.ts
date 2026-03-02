import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/configurations/responses/error";
import { verifyAccessToken } from "@/utils/token";
import { asyncHandler } from "@/utils/async-handler";
import authenticationRepository from "@/repositories/authentication";

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

    const payload = verifyAccessToken<JwtTokenPayload>(token);

    if (!payload || !payload.userId) {
      throw new UnauthorizedError(t("common:errors.invalidToken"));
    }

    const authId = payload.authId || payload.userId;
    const auth = await authenticationRepository.findById(authId);

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

    next();
  }
);
