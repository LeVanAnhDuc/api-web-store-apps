import type { Request } from "express";
import type { CanActivate } from "@/core/common";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import { verifyAccessToken } from "@/utils/token";

export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthenticationService) {}

  async canActivate(req: Request): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      return;
    }

    const payload = verifyAccessToken<JwtTokenPayload>(token);

    if (!payload || !payload.userId) {
      return;
    }

    const authId = payload.authId || payload.userId;
    const auth = await this.authService.findById(authId);

    if (!auth) {
      return;
    }

    if (
      auth.passwordChangedAt &&
      payload.iat &&
      payload.iat < Math.floor(auth.passwordChangedAt.getTime() / 1000)
    ) {
      return;
    }

    req.user = {
      userId: payload.userId,
      authId,
      email: payload.email || "",
      roles: payload.roles || "user",
      fullName: payload.fullName || ""
    };
  }
}
