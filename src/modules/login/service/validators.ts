import type { AuthenticationDocument } from "@/modules/authentication/types";
import {
  BadRequestError,
  UnauthorizedError
} from "@/configurations/responses/error";
import { Logger } from "@/utils/logger";
import { findAuthenticationByEmail } from "@/modules/login/repository";

export const ensureCooldownExpired = async <
  T extends {
    checkCooldown: (email: string) => Promise<boolean>;
    getCooldownRemaining: (email: string) => Promise<number>;
  }
>(
  store: T,
  email: string,
  t: TranslateFunction,
  logMessage: string,
  errorKey: "login:errors.otpCooldown" | "login:errors.magicLinkCooldown"
): Promise<void> => {
  const canSend = await store.checkCooldown(email);

  if (!canSend) {
    const remaining = await store.getCooldownRemaining(email);
    Logger.warn(logMessage, { email, remaining });
    throw new BadRequestError(t(errorKey, { seconds: remaining }));
  }
};

export const ensureAuthenticationExists = async (
  email: string,
  t: TranslateFunction
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
  t: TranslateFunction
): void => {
  if (!auth.isActive) {
    Logger.warn("Account inactive", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }
};

export const ensureEmailVerified = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (!auth.verifiedEmail) {
    Logger.warn("Email not verified", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }
};

export const validateAuthenticationForLogin = async (
  email: string,
  t: TranslateFunction
): Promise<AuthenticationDocument> => {
  const auth = await ensureAuthenticationExists(email, t);
  ensureAccountActive(auth, email, t);
  ensureEmailVerified(auth, email, t);
  return auth;
};
