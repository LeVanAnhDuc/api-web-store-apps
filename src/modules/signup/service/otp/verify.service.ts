import type {
  VerifyOtpRequest,
  VerifyOtpResponse
} from "@/types/modules/signup";
import { BadRequestError } from "@/configurations/responses/error";
import { Logger } from "@/utils/logger";
import { otpStore, sessionStore } from "@/modules/signup/store";
import { OTP_CONFIG, SESSION_CONFIG } from "@/constants/config";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";
import { ensureOtpNotLocked } from "../validators";

const CONFIG = {
  MAX_FAILED_ATTEMPTS: OTP_CONFIG.MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES: OTP_CONFIG.LOCKOUT_DURATION_MINUTES,
  SESSION_EXPIRY_SECONDS: SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE
};

const trackFailedOtpAttempt = async (email: string): Promise<number> => {
  const failedCount = await otpStore.incrementFailedAttempts(
    email,
    CONFIG.LOCKOUT_DURATION_MINUTES
  );

  Logger.warn("Invalid OTP attempt", {
    email,
    failedCount,
    lockoutDurationMinutes: CONFIG.LOCKOUT_DURATION_MINUTES
  });

  return failedCount;
};

const throwInvalidOtpError = (
  attempts: number,
  t: TranslateFunction
): never => {
  const remaining = CONFIG.MAX_FAILED_ATTEMPTS - attempts;

  if (remaining > 0) {
    throw new BadRequestError(
      t("signup:errors.invalidOtpWithRemaining", { remaining })
    );
  }

  throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
};

const verifyOtp = async (
  email: string,
  otp: string,
  t: TranslateFunction
): Promise<void> => {
  const isValid = await otpStore.verify(email, otp);

  if (!isValid) {
    const attempts = await trackFailedOtpAttempt(email);
    throwInvalidOtpError(attempts, t);
  }
};

const createAndStoreSession = async (email: string): Promise<string> => {
  const sessionToken = sessionStore.createToken();

  await sessionStore.store(email, sessionToken, CONFIG.SESSION_EXPIRY_SECONDS);

  Logger.debug("Signup session created", {
    email,
    expiresInSeconds: CONFIG.SESSION_EXPIRY_SECONDS
  });

  return sessionToken;
};

export const verifyOtpService = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t } = req;

  Logger.info("VerifyOtp initiated", { email });

  await ensureOtpNotLocked(email, CONFIG.MAX_FAILED_ATTEMPTS, t);

  await verifyOtp(email, otp, t);

  const sessionToken = await createAndStoreSession(email);

  await otpStore.cleanupOtpData(email);

  Logger.info("VerifyOtp completed successfully", {
    email,
    sessionExpiresIn: CONFIG.SESSION_EXPIRY_SECONDS
  });

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionToken,
      expiresIn: CONFIG.SESSION_EXPIRY_SECONDS
    }
  };
};
