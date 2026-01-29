import type { TFunction } from "i18next";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import { UnauthorizedError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { findAuthenticationByEmail } from "@/modules/login/repository";

export const ensureAuthenticationExists = async (
  email: string,
  t: TFunction
): Promise<AuthenticationDocument> => {
  const auth = await findAuthenticationByEmail(email);

  if (!auth) {
    Logger.warn("Authentication not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidEmail"));
  }

  return auth;
};

export const ensureAccountActive = (
  auth: AuthenticationDocument,
  email: string,
  t: TFunction
): void => {
  if (!auth.isActive) {
    Logger.warn("Account inactive", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }
};

export const ensureEmailVerified = (
  auth: AuthenticationDocument,
  email: string,
  t: TFunction
): void => {
  if (!auth.verifiedEmail) {
    Logger.warn("Email not verified", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }
};

export const validateAuthenticationForLogin = async (
  email: string,
  t: TFunction
): Promise<AuthenticationDocument> => {
  const auth = await ensureAuthenticationExists(email, t);
  ensureAccountActive(auth, email, t);
  ensureEmailVerified(auth, email, t);
  return auth;
};
