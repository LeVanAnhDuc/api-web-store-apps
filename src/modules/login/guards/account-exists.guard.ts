// types
import type { Request } from "express";
import type { UserService } from "@/modules/user/user.service";
import type { UserWithAuth } from "@/modules/user/types";
import type { LoginAuditService } from "../services/login-audit.service";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/utils/logger";

export class AccountExistsGuard {
  constructor(
    private readonly userService: UserService,
    private readonly audit: LoginAuditService
  ) {}

  tryFind(email: string): Promise<UserWithAuth | null> {
    return this.userService.findByEmailWithAuth(email);
  }

  async assert(email: string, t: TranslateFunction): Promise<UserWithAuth> {
    const result = await this.userService.findByEmailWithAuth(email);

    if (result) return result;

    Logger.warn("Authentication not found", { email });
    throw new UnauthorizedError(
      t("login:errors.invalidEmail"),
      ERROR_CODES.LOGIN_INVALID_EMAIL
    );
  }

  async assertWithCredentialAudit(
    email: string,
    req: Request,
    t: TranslateFunction
  ): Promise<UserWithAuth> {
    const result = await this.userService.findByEmailWithAuth(email);

    if (result) return result;

    this.audit.recordInvalidCredentials({ email, req });
    throw new UnauthorizedError(
      t("login:errors.invalidCredentials"),
      ERROR_CODES.LOGIN_INVALID_CREDENTIALS
    );
  }
}
