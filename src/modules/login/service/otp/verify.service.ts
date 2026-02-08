import i18next from "@/i18n";
import type { OtpVerifyRequest, LoginResponse } from "@/modules/login/types";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import { UnauthorizedError, BadRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { otpStore } from "@/modules/login/store";
import { ensureAuthenticationExists } from "../validators";
import { recordFailedLogin, completeSuccessfulLogin } from "../shared";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS,
  LOGIN_OTP_CONFIG
} from "@/modules/login/constants";

const ensureOtpNotLocked = async (
  email: string,
  language: string
): Promise<void> => {
  const isLocked = await otpStore.isLocked(email);

  if (!isLocked) return;

  const attempts = await otpStore.getFailedAttemptCount(email);
  Logger.warn("Login OTP verification locked", { email, attempts });

  throw new BadRequestError(
    i18next.t("login:errors.otpLocked", {
      minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
      lng: language
    })
  );
};

const trackFailedOtpAttempt = async (
  email: string,
  auth: AuthenticationDocument,
  req: OtpVerifyRequest
): Promise<number> => {
  const attempts = await otpStore.incrementFailedAttempts(email);

  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.OTP,
    failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
    req
  });

  Logger.warn("Login OTP verification failed", { email, attempts });
  return attempts;
};

const throwOtpError = (attempts: number, language: string): never => {
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

const handleInvalidOtp = async (
  email: string,
  auth: AuthenticationDocument,
  language: string,
  req: OtpVerifyRequest
): Promise<never> => {
  const attempts = await trackFailedOtpAttempt(email, auth, req);
  return throwOtpError(attempts, language);
};

export const verifyLoginOtpService = async (
  req: OtpVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  Logger.info("Login OTP verification initiated", { email });

  await ensureOtpNotLocked(email, language);

  const auth = await ensureAuthenticationExists(email, t);

  const isValid = await otpStore.verify(email, otp);

  if (!isValid) await handleInvalidOtp(email, auth, language, req);

  withRetry(() => otpStore.cleanupAll(email), {
    operationName: "cleanupLoginOtpData",
    context: { email }
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: completeSuccessfulLogin({
      email,
      auth,
      loginMethod: LOGIN_METHODS.OTP,
      req
    })
  };
};
