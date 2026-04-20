// types
import type { Request } from "express";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { LoginMethod } from "@/types/modules/login";
import type { LoginAuditService } from "../services/login-audit.service";
// config
import { UnauthorizedError } from "@/config/responses/error";
// others
import { ERROR_CODES } from "@/constants/error-code";

export class EmailVerifiedGuard {
  constructor(private readonly audit: LoginAuditService) {}

  assert(auth: AuthenticationDocument, t: TranslateFunction): void {
    if (auth.verifiedEmail) return;

    throw new UnauthorizedError(
      t("login:errors.emailNotVerified"),
      ERROR_CODES.LOGIN_EMAIL_NOT_VERIFIED
    );
  }

  assertWithAudit(
    auth: AuthenticationDocument,
    email: string,
    method: LoginMethod,
    req: Request,
    t: TranslateFunction
  ): void {
    if (auth.verifiedEmail) return;

    this.audit.recordEmailNotVerified({ auth, email, method, req });
    throw new UnauthorizedError(
      t("login:errors.emailNotVerified"),
      ERROR_CODES.LOGIN_EMAIL_NOT_VERIFIED
    );
  }
}
