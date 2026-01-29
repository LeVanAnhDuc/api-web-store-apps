import i18next from "@/i18n";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type {
  PasswordLoginRequest,
  LoginResponse
} from "@/modules/login/types";
import { UnauthorizedError, BadRequestError } from "@/infra/responses/error";
import { isValidPassword } from "@/app/utils/crypto/bcrypt";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { findAuthenticationByEmail } from "@/modules/login/repository";
import { failedAttemptsStore, formatDuration } from "@/modules/login/store";
import { ensureAccountActive, ensureEmailVerified } from "../validators";
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "../shared";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/modules/login/constants";

const ensureLoginNotLocked = async (
  email: string,
  language: string
): Promise<void> => {
  const { isLocked, remainingSeconds } =
    await failedAttemptsStore.checkLockout(email);

  if (!isLocked) return;

  const attemptCount = await failedAttemptsStore.getCount(email);
  const timeMessage = formatDuration(remainingSeconds, language);

  Logger.warn("Login blocked - account locked", {
    email,
    attemptCount,
    remainingSeconds
  });

  throw new BadRequestError(
    i18next.t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage,
      lng: language
    })
  );
};

function ensureAccountExists(
  auth: AuthenticationDocument | null,
  email: string,
  t: PasswordLoginRequest["t"]
): asserts auth is AuthenticationDocument {
  if (auth) return;

  Logger.warn("Login failed - email not found", { email });
  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
}

const ensureAccountActiveWithLogging = (
  auth: AuthenticationDocument,
  email: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
) => {
  if (auth.isActive) return;

  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.ACCOUNT_INACTIVE,
    req
  });

  ensureAccountActive(auth, email, t);
};

const ensureEmailVerifiedWithLogging = (
  auth: AuthenticationDocument,
  email: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
) => {
  if (auth.verifiedEmail) return;

  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.EMAIL_NOT_VERIFIED,
    req
  });

  ensureEmailVerified(auth, email, t);
};

const trackFailedPasswordAttempt = async (
  email: string,
  auth: AuthenticationDocument,
  req: PasswordLoginRequest
): Promise<{ attemptCount: number; lockoutSeconds: number }> => {
  const { attemptCount, lockoutSeconds } =
    await failedAttemptsStore.trackAttempt(email);

  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
    req
  });

  Logger.warn("Login failed - invalid password", { email, attemptCount });
  return { attemptCount, lockoutSeconds };
};

const throwPasswordError = (
  attemptCount: number,
  lockoutSeconds: number,
  language: string,
  t: PasswordLoginRequest["t"]
): never => {
  if (attemptCount >= 5 && lockoutSeconds > 0) {
    const timeMessage = formatDuration(lockoutSeconds, language);
    throw new BadRequestError(
      i18next.t("login:errors.accountLocked", {
        attempts: attemptCount,
        time: timeMessage,
        lng: language
      })
    );
  }

  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
};

const verifyPasswordOrFail = async (
  auth: AuthenticationDocument,
  password: string,
  email: string,
  language: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): Promise<void> => {
  const passwordValid = isValidPassword(password, auth.password);

  if (passwordValid) return;

  const { attemptCount, lockoutSeconds } = await trackFailedPasswordAttempt(
    email,
    auth,
    req
  );

  throwPasswordError(attemptCount, lockoutSeconds, language, t);
};

export const passwordLoginService = async (
  req: PasswordLoginRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, password } = req.body;
  const { language, t } = req;

  Logger.info("Password login initiated", { email });

  await ensureLoginNotLocked(email, language);

  const auth = await findAuthenticationByEmail(email);

  ensureAccountExists(auth, email, t);
  ensureAccountActiveWithLogging(auth, email, req, t);
  ensureEmailVerifiedWithLogging(auth, email, req, t);

  await verifyPasswordOrFail(auth, password, email, language, req, t);

  updateLastLogin(auth._id.toString());

  withRetry(() => failedAttemptsStore.resetAll(email), {
    operationName: "resetFailedLoginAttempts",
    context: { email }
  });

  recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    req
  });

  Logger.info("Password login successful", {
    email,
    userId: auth._id.toString()
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: generateLoginTokens(auth)
  };
};
