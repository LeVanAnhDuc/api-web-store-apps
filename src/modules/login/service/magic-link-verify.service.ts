import type { TFunction } from "i18next";
import type {
  MagicLinkVerifyRequest,
  LoginResponse
} from "@/modules/login/types";
import type { AuthDocument } from "@/modules/auth/types";
import { UnauthorizedError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { findAuthByEmail } from "@/modules/login/repository";
import {
  verifyMagicLinkToken,
  cleanupMagicLinkData
} from "@/modules/login/utils/store";
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/modules/login/constants";

const ensureAuthExists = async (
  email: string,
  t: TFunction
): Promise<AuthDocument> => {
  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("Magic link verification failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
  }

  return auth;
};

const handleInvalidToken = (
  email: string,
  auth: AuthDocument,
  req: MagicLinkVerifyRequest,
  t: TFunction
): never => {
  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
    req
  });

  Logger.warn("Magic link verification failed - invalid token", { email });
  throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
};

const completeSuccessfulLogin = (
  email: string,
  auth: AuthDocument,
  req: MagicLinkVerifyRequest
): LoginResponse => {
  updateLastLogin(auth._id.toString());

  recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    req
  });

  Logger.info("Magic link verification successful", {
    email,
    userId: auth._id.toString()
  });

  return generateLoginTokens(auth);
};

export const verifyMagicLinkService = async (
  req: MagicLinkVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, token } = req.body;
  const { t } = req;

  Logger.info("Magic link verification initiated", { email });

  const auth = await ensureAuthExists(email, t);

  const isValid = await verifyMagicLinkToken(email, token);

  if (!isValid) handleInvalidToken(email, auth, req, t);

  withRetry(() => cleanupMagicLinkData(email), {
    operationName: "cleanupMagicLinkData",
    context: { email }
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: completeSuccessfulLogin(email, auth, req)
  };
};
