/**
 * Password Login Service
 * Use Case: User logs in with email and password
 *
 * Business Flow:
 * 1. Check account lockout status
 * 2. Verify email exists and account is active
 * 3. Verify password
 * 4. Create session and generate tokens
 * 5. Record login history
 * 6. Reset failed attempts on success
 *
 * Rate Limiting: Handled by middleware (IP-based)
 * Validation: Handled by schema layer
 */

// libs
import i18next from "@/i18n";

// types
import type {
  PasswordLoginRequest,
  LoginWithSessionResponse
} from "@/shared/types/modules/login";

// errors
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";

// helpers
import { isValidPassword } from "@/core/helpers/bcrypt";

// utils
import { Logger } from "@/core/utils/logger";

// repository
import { findAuthByEmail } from "@/modules/login/repository";

// store
import {
  checkLoginLockout,
  getFailedLoginAttempts,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts
} from "@/modules/login/utils/store";

// shared
import {
  createLoginSession,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";

// constants
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS
} from "@/shared/constants/modules/session";

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

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

  if (isLocked) {
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
  }
};

// =============================================================================
// Main Service
// =============================================================================

export const passwordLogin = async (
  req: PasswordLoginRequest
): Promise<Partial<ResponsePattern<LoginWithSessionResponse>>> => {
  const { email, password } = req.body;
  const { language, t } = req;

  Logger.info("Password login initiated", { email });

  await ensureAccountNotLocked(email, language);

  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("Login failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  if (!auth.isActive) {
    await recordFailedLogin({
      userId: auth._id,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.ACCOUNT_INACTIVE,
      req
    });

    Logger.warn("Login failed - account inactive", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }

  if (!auth.verifiedEmail) {
    await recordFailedLogin({
      userId: auth._id,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.EMAIL_NOT_VERIFIED,
      req
    });

    Logger.warn("Login failed - email not verified", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }

  const passwordValid = isValidPassword(password, auth.password);

  if (!passwordValid) {
    const { attemptCount, lockoutSeconds } =
      await incrementFailedLoginAttempts(email);

    await recordFailedLogin({
      userId: auth._id,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
      req
    });

    Logger.warn("Login failed - invalid password", {
      email,
      attemptCount
    });

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
  }

  await resetFailedLoginAttempts(email);

  const loginResponse = await createLoginSession({
    auth,
    loginMethod: LOGIN_METHODS.PASSWORD,
    req
  });

  await recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.PASSWORD,
    req
  });

  Logger.info("Password login successful", {
    email,
    userId: auth._id.toString(),
    isNewDevice: loginResponse.isNewDevice,
    isNewLocation: loginResponse.isNewLocation
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: loginResponse
  };
};
