import i18next from "@/i18n";
import type { TFunction } from "i18next";
import type {
  VerifyOtpRequest,
  VerifyOtpResponse
} from "@/modules/signup/types";
import { BadRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { otpStore, sessionStore } from "@/modules/signup/store";
import { OTP_CONFIG, SESSION_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";
import { generateSecureToken } from "@/app/utils/crypto/otp";

const TIME_MAX_FAILED_ATTEMPTS = OTP_CONFIG.MAX_FAILED_ATTEMPTS;
const TIME_LOCKOUT_DURATION_MINUTES = OTP_CONFIG.LOCKOUT_DURATION_MINUTES;
const TIME_EXPIRES_SESSION_MINUTES =
  SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

const ensureOtpNotLocked = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const isLocked = await otpStore.isLocked(email, TIME_MAX_FAILED_ATTEMPTS);

  if (isLocked) {
    Logger.warn("OTP account locked", {
      email,
      maxAttempts: TIME_MAX_FAILED_ATTEMPTS
    });
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }
};

const trackFailedOtpAttempt = async (email: string): Promise<number> => {
  const failedCount = await otpStore.incrementFailedAttempts(
    email,
    TIME_LOCKOUT_DURATION_MINUTES
  );

  Logger.warn("Invalid OTP attempt", {
    email,
    failedCount,
    lockoutDurationMinutes: TIME_LOCKOUT_DURATION_MINUTES
  });

  return failedCount;
};

const throwOtpError = (
  attempts: number,
  language: string,
  t: TFunction
): never => {
  const remaining = TIME_MAX_FAILED_ATTEMPTS - attempts;

  if (remaining > 0) {
    throw new BadRequestError(
      i18next.t("signup:errors.invalidOtpWithRemaining", {
        remaining,
        lng: language
      })
    );
  }

  throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
};

const verifyOtpOrFail = async (
  email: string,
  otp: string,
  t: TFunction,
  language: string
): Promise<void> => {
  const isValid = await otpStore.verify(email, otp);

  if (!isValid) {
    const attempts = await trackFailedOtpAttempt(email);
    throwOtpError(attempts, language, t);
  }
};

const createAndStoreSession = async (email: string): Promise<string> => {
  const sessionToken = generateSecureToken(SESSION_CONFIG.TOKEN_LENGTH);

  await sessionStore.store(email, sessionToken, TIME_EXPIRES_SESSION_MINUTES);

  Logger.debug("Signup session created", {
    email,
    expiresInSeconds: TIME_EXPIRES_SESSION_MINUTES
  });

  return sessionToken;
};

export const verifyOtpService = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  Logger.info("VerifyOtp initiated", { email });

  await ensureOtpNotLocked(email, t);

  await verifyOtpOrFail(email, otp, t, language);

  const sessionToken = await createAndStoreSession(email);

  await otpStore.cleanupOtpData(email);

  Logger.info("VerifyOtp completed successfully", {
    email,
    sessionExpiresIn: TIME_EXPIRES_SESSION_MINUTES
  });

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionToken,
      expiresIn: TIME_EXPIRES_SESSION_MINUTES
    }
  };
};
