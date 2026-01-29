import type { TFunction } from "i18next";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import i18next from "@/i18n";
import { BadRequestError, UnauthorizedError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { findAuthenticationByEmail } from "@/modules/login/repository";

export const ensureCooldownExpired = async <
  T extends {
    checkCooldown: (email: string) => Promise<boolean>;
    getCooldownRemaining: (email: string) => Promise<number>;
  }
>(
  store: T,
  email: string,
  language: string,
  logMessage: string,
  errorKey: "login:errors.otpCooldown" | "login:errors.magicLinkCooldown"
): Promise<void> => {
  const canSend = await store.checkCooldown(email);

  if (!canSend) {
    const remaining = await store.getCooldownRemaining(email);
    Logger.warn(logMessage, { email, remaining });
    throw new BadRequestError(
      i18next.t(errorKey, {
        seconds: remaining,
        lng: language
      })
    );
  }
};

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
