// types
import type { Request } from "express";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { LoginMethod } from "@/modules/login-history/types";
import type { LoginAuditService } from "../services/login-audit.service";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";

export class AccountActiveGuard {
  constructor(private readonly audit: LoginAuditService) {}

  assert(auth: AuthenticationDocument, t: TranslateFunction): void {
    if (auth.isActive) return;

    throw new UnauthorizedError(
      t("login:errors.accountInactive"),
      ERROR_CODES.LOGIN_ACCOUNT_INACTIVE
    );
  }

  assertWithAudit(
    auth: AuthenticationDocument,
    email: string,
    method: LoginMethod,
    req: Request,
    t: TranslateFunction
  ): void {
    if (auth.isActive) return;

    this.audit.recordInactiveAccount({ auth, email, method, req });
    throw new UnauthorizedError(
      t("login:errors.accountInactive"),
      ERROR_CODES.LOGIN_ACCOUNT_INACTIVE
    );
  }
}
