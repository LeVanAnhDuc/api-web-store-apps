import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { PasswordLoginRequest } from "@/types/modules/login";
import {
  BadRequestError,
  UnauthorizedError
} from "@/configurations/responses/error";
import { Logger } from "@/utils/logger";
import { formatDuration } from "@/utils/date";
import type authenticationRepository from "@/repositories/authentication";
import { failedAttemptsStore, otpStore } from "@/modules/login/store";
import { recordFailedLogin } from "./helpers";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/constants/enums";
import { LOGIN_OTP_CONFIG } from "@/constants/config";

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
  t: TranslateFunction,
  authRepo: typeof authenticationRepository
): Promise<AuthenticationDocument> => {
  const auth = await authRepo.findByEmail(email);

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
  t: TranslateFunction,
  authRepo: typeof authenticationRepository
): Promise<AuthenticationDocument> => {
  const auth = await ensureAuthenticationExists(email, t, authRepo);
  ensureAccountActive(auth, email, t);
  ensureEmailVerified(auth, email, t);
  return auth;
};

export const ensureLoginNotLocked = async (
  email: string,
  t: PasswordLoginRequest["t"],
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
    t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage
    })
  );
};

export function ensureAccountExists(
  auth: AuthenticationDocument | null,
  email: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): asserts auth is AuthenticationDocument {
  if (auth) return;

  recordFailedLogin({
    userId: null,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
    req
  });

  Logger.warn("Login failed - email not found", { email });
  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
}

export const ensureAccountActiveWithLogging = (
  auth: AuthenticationDocument,
  email: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): void => {
  if (auth.isActive) return;

  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.ACCOUNT_INACTIVE,
    req
  });

  ensureAccountActive(auth, email, t);
};

export const ensureEmailVerifiedWithLogging = (
  auth: AuthenticationDocument,
  email: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): void => {
  if (auth.verifiedEmail) return;

  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.EMAIL_NOT_VERIFIED,
    req
  });

  ensureEmailVerified(auth, email, t);
};

export const ensureOtpNotLocked = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const isLocked = await otpStore.isLocked(email);

  if (!isLocked) return;

  const attempts = await otpStore.getFailedAttemptCount(email);
  Logger.warn("Login OTP verification locked", { email, attempts });

  throw new BadRequestError(
    t("login:errors.otpLocked", {
      minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    })
  );
};

export const ensureCanResend = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const exceeded = await otpStore.hasExceededResendLimit(email);

  if (exceeded) {
    Logger.warn("Login OTP resend limit exceeded", { email });
    throw new BadRequestError(t("login:errors.otpResendLimitExceeded"));
  }
};

export const throwPasswordError = (
  attemptCount: number,
  lockoutSeconds: number,
  language: string,
  t: PasswordLoginRequest["t"]
): never => {
  if (attemptCount >= 5 && lockoutSeconds > 0) {
    const timeMessage = formatDuration(lockoutSeconds, language);
    throw new BadRequestError(
      t("login:errors.accountLocked", {
        attempts: attemptCount,
        time: timeMessage
      })
    );
  }

  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
};

export const throwOtpError = (
  attempts: number,
  t: TranslateFunction
): never => {
  const remaining = LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

  if (remaining <= 0) {
    throw new BadRequestError(
      t("login:errors.otpLocked", {
        minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      })
    );
  }

  throw new UnauthorizedError(
    t("login:errors.invalidOtpWithRemaining", { remaining })
  );
};
