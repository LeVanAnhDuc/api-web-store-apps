import i18next from "@/i18n";
import type { AuthDocument } from "@/modules/auth/types";
import type {
  PasswordLoginRequest,
  LoginResponse
} from "@/modules/login/types";
import { UnauthorizedError, BadRequestError } from "@/infra/responses/error";
import { isValidPassword } from "@/app/utils/crypto/bcrypt";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { findAuthByEmail } from "@/modules/login/repository";
import {
  checkLoginLockout,
  getFailedLoginAttempts,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts
} from "@/modules/login/utils/store";
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/modules/login/constants";

const formatTimeMessage = (seconds: number, language: string): string => {
  if (seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
    return language === "vi"
      ? `${minutes} phút`
      : `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return language === "vi"
    ? `${seconds} giây`
    : `${seconds} second${seconds > 1 ? "s" : ""}`;
};

const ensureAccountNotLocked = async (
  email: string,
  language: string
): Promise<void> => {
  const { isLocked, remainingSeconds } = await checkLoginLockout(email);

  if (!isLocked) return;

  const attemptCount = await getFailedLoginAttempts(email);
  const timeMessage = formatTimeMessage(remainingSeconds, language);

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
  auth: AuthDocument | null,
  email: string,
  t: PasswordLoginRequest["t"]
): asserts auth is AuthDocument {
  if (auth) return;

  Logger.warn("Login failed - email not found", { email });
  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
}

const ensureAccountActive = (
  auth: AuthDocument,
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

  Logger.warn("Login failed - account inactive", { email });
  throw new UnauthorizedError(t("login:errors.accountInactive"));
};

const ensureEmailVerified = (
  auth: AuthDocument,
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

  Logger.warn("Login failed - email not verified", { email });
  throw new UnauthorizedError(t("login:errors.emailNotVerified"));
};

const verifyPasswordOrFail = async (
  auth: AuthDocument,
  password: string,
  email: string,
  language: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): Promise<void> => {
  const passwordValid = isValidPassword(password, auth.password);

  if (passwordValid) return;

  const { attemptCount, lockoutSeconds } =
    await incrementFailedLoginAttempts(email);

  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
    req
  });

  Logger.warn("Login failed - invalid password", { email, attemptCount });

  if (attemptCount >= 5 && lockoutSeconds > 0) {
    const timeMessage = formatTimeMessage(lockoutSeconds, language);
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

export const passwordLoginService = async (
  req: PasswordLoginRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, password } = req.body;
  const { language, t } = req;

  Logger.info("Password login initiated", { email });

  await ensureAccountNotLocked(email, language);

  const auth = await findAuthByEmail(email);

  ensureAccountExists(auth, email, t);
  ensureAccountActive(auth, email, req, t);
  ensureEmailVerified(auth, email, req, t);

  await verifyPasswordOrFail(auth, password, email, language, req, t);

  updateLastLogin(auth._id.toString());

  withRetry(() => resetFailedLoginAttempts(email), {
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
