import type { Schema } from "mongoose";
import type { Gender } from "@/types/modules/user";
import { BadRequestError } from "@/configurations/responses/error";
import { Logger } from "@/utils/logger";
import type authenticationRepository from "@/repositories/authentication";
import type userRepository from "@/repositories/user";
import { otpStore, sessionStore } from "@/modules/signup/store";
import { hashValue } from "@/utils/crypto/bcrypt";
import { OTP_CONFIG, SESSION_CONFIG } from "@/constants/config";
import {
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR
} from "@/constants/infrastructure";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const OTP_EXPIRY_SECONDS =
  OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
export const OTP_COOLDOWN_SECONDS = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;
export const RESEND_WINDOW_SECONDS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
export const MAX_RESEND_COUNT = OTP_CONFIG.MAX_RESEND_COUNT;
export const MAX_FAILED_ATTEMPTS = OTP_CONFIG.MAX_FAILED_ATTEMPTS;
export const LOCKOUT_DURATION_MINUTES = OTP_CONFIG.LOCKOUT_DURATION_MINUTES;
export const SESSION_EXPIRY_SECONDS =
  SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

// ──────────────────────────────────────────────
// OTP helpers
// ──────────────────────────────────────────────

export const createAndStoreOtp = async (
  email: string,
  expirySeconds: number
): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, expirySeconds);

  Logger.debug("OTP created and stored", {
    email,
    expiresInSeconds: expirySeconds
  });

  return otp;
};

export const setOtpCooldown = async (
  email: string,
  cooldownSeconds: number
): Promise<void> => {
  await otpStore.setCooldown(email, cooldownSeconds);

  Logger.debug("OTP cooldown set", {
    email,
    cooldownSeconds
  });
};

export const trackResendAttempt = async (email: string): Promise<number> => {
  const count = await otpStore.incrementResendCount(
    email,
    RESEND_WINDOW_SECONDS
  );

  Logger.debug("Resend attempt tracked", {
    email,
    currentCount: count,
    maxResends: MAX_RESEND_COUNT,
    windowSeconds: RESEND_WINDOW_SECONDS
  });

  return count;
};

// ──────────────────────────────────────────────
// OTP verify helpers
// ──────────────────────────────────────────────

const trackFailedOtpAttempt = async (email: string): Promise<number> => {
  const failedCount = await otpStore.incrementFailedAttempts(
    email,
    LOCKOUT_DURATION_MINUTES
  );

  Logger.warn("Invalid OTP attempt", {
    email,
    failedCount,
    lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES
  });

  return failedCount;
};

const throwInvalidOtpError = (
  attempts: number,
  t: TranslateFunction
): never => {
  const remaining = MAX_FAILED_ATTEMPTS - attempts;

  if (remaining > 0) {
    throw new BadRequestError(
      t("signup:errors.invalidOtpWithRemaining", { remaining })
    );
  }

  throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
};

export const verifyOtp = async (
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

export const createAndStoreSession = async (email: string): Promise<string> => {
  const sessionToken = sessionStore.createToken();

  await sessionStore.store(email, sessionToken, SESSION_EXPIRY_SECONDS);

  Logger.debug("Signup session created", {
    email,
    expiresInSeconds: SESSION_EXPIRY_SECONDS
  });

  return sessionToken;
};

// ──────────────────────────────────────────────
// Account creation helpers
// ──────────────────────────────────────────────

const createAuthentication = async (
  email: string,
  password: string,
  authRepo: typeof authenticationRepository
): Promise<Schema.Types.ObjectId> => {
  const hashedPassword = hashValue(password);

  const auth = await authRepo.create({
    email,
    hashedPassword
  });

  Logger.debug("Auth record created", {
    email,
    authId: auth._id.toString()
  });

  return auth._id;
};

const createUser = async (
  authId: Schema.Types.ObjectId,
  fullName: string,
  gender: Gender,
  dateOfBirth: string,
  userRepo: typeof userRepository
): Promise<Schema.Types.ObjectId> => {
  const user = await userRepo.createProfile({
    authId,
    fullName,
    gender,
    dateOfBirth: new Date(dateOfBirth)
  });

  Logger.info("User profile created", {
    userId: user._id.toString(),
    authId: authId.toString()
  });

  return user._id;
};

export const createUserAccount = async (
  email: string,
  password: string,
  fullName: string,
  gender: Gender,
  dateOfBirth: string,
  authRepo: typeof authenticationRepository,
  userRepo: typeof userRepository
): Promise<{
  authId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  email: string;
  fullName: string;
}> => {
  const authId = await createAuthentication(email, password, authRepo);
  const userId = await createUser(
    authId,
    fullName,
    gender,
    dateOfBirth,
    userRepo
  );

  return {
    authId,
    userId,
    email,
    fullName
  };
};

export const cleanupSignupData = async (email: string): Promise<void> => {
  await Promise.all([
    otpStore.cleanupOtpData(email),
    sessionStore.clear(email)
  ]);

  Logger.debug("Signup data cleaned up", { email });
};
