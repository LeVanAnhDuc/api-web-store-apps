import type { OtpVerifyRequest, LoginResponse } from "@/types/modules/login";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import {
  UnauthorizedError,
  BadRequestError
} from "@/configurations/responses/error";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { otpStore } from "@/modules/login/store";
import { ensureAuthenticationExists } from "../validators";
import { recordFailedLogin, completeSuccessfulLogin } from "../shared";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/constants/enums";
import { LOGIN_OTP_CONFIG } from "@/constants/config";

const ensureOtpNotLocked = async (
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

const throwOtpError = (attempts: number, t: TranslateFunction): never => {
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

const handleInvalidOtp = async (
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction,
  req: OtpVerifyRequest
): Promise<never> => {
  const attempts = await trackFailedOtpAttempt(email, auth, req);
  return throwOtpError(attempts, t);
};

export const verifyLoginOtpService = async (
  req: OtpVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, otp } = req.body;
  const { t } = req;

  Logger.info("Login OTP verification initiated", { email });

  await ensureOtpNotLocked(email, t);

  const auth = await ensureAuthenticationExists(email, t);

  const isValid = await otpStore.verify(email, otp);

  if (!isValid) await handleInvalidOtp(email, auth, t, req);

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
