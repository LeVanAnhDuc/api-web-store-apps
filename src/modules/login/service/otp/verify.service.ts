import i18next from "@/i18n";
import type { TFunction } from "i18next";
import type { OtpVerifyRequest, LoginResponse } from "@/modules/login/types";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import { UnauthorizedError, BadRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { findAuthenticationByEmail } from "@/modules/login/repository";
import loginCacheStore from "@/modules/login/store/LoginCacheStore";
import {
  generateLoginTokens,
  updateLastLogin,
  recordSuccessfulLogin,
  recordFailedLogin
} from "../shared";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS,
  LOGIN_OTP_CONFIG
} from "@/modules/login/constants";

const ensureNotLocked = async (
  email: string,
  language: string
): Promise<void> => {
  const isLocked = await loginCacheStore.isLoginOtpLocked(email);

  if (!isLocked) return;

  const attempts = await loginCacheStore.getFailedLoginOtpAttempts(email);
  Logger.warn("Login OTP verification locked", { email, attempts });

  throw new BadRequestError(
    i18next.t("login:errors.otpLocked", {
      minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
      lng: language
    })
  );
};

const ensureAuthExists = async (
  email: string,
  t: TFunction
): Promise<AuthenticationDocument> => {
  const auth = await findAuthenticationByEmail(email);

  if (!auth) {
    Logger.warn("OTP verification failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidOtp"));
  }

  return auth;
};

const handleInvalidOtp = async (
  email: string,
  auth: AuthenticationDocument,
  language: string,
  req: OtpVerifyRequest
): Promise<never> => {
  const attempts = await loginCacheStore.incrementFailedLoginOtpAttempts(email);

  recordFailedLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.OTP,
    failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
    req
  });

  Logger.warn("Login OTP verification failed - invalid OTP", {
    email,
    attempts
  });

  const remaining = LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

  if (remaining <= 0) {
    throw new BadRequestError(
      i18next.t("login:errors.otpLocked", {
        minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
        lng: language
      })
    );
  }

  throw new UnauthorizedError(
    i18next.t("login:errors.invalidOtpWithRemaining", {
      remaining,
      lng: language
    })
  );
};

const completeSuccessfulLogin = (
  email: string,
  auth: AuthenticationDocument,
  req: OtpVerifyRequest
): LoginResponse => {
  updateLastLogin(auth._id.toString());

  recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.OTP,
    req
  });

  Logger.info("Login OTP verification successful", {
    email,
    userId: auth._id.toString()
  });

  return generateLoginTokens(auth);
};

export const verifyLoginOtpService = async (
  req: OtpVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  Logger.info("Login OTP verification initiated", { email });

  await ensureNotLocked(email, language);

  const auth = await ensureAuthExists(email, t);

  const isValid = await loginCacheStore.verifyLoginOtp(email, otp);

  if (!isValid) await handleInvalidOtp(email, auth, language, req);

  withRetry(() => loginCacheStore.cleanupLoginOtpData(email), {
    operationName: "cleanupLoginOtpData",
    context: { email }
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: completeSuccessfulLogin(email, auth, req)
  };
};
