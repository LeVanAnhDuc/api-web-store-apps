import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type {
  PasswordLoginRequest,
  LoginResponse,
  LoginMethod,
  OtpVerifyRequest,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import type { LoginFailReason } from "@/types/modules/login-history";
import { UnauthorizedError } from "@/configurations/responses/error";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { generateAuthTokensResponse } from "@/utils/token";
import { Logger } from "@/utils/logger";
import {
  failedAttemptsStore,
  otpStore,
  magicLinkStore
} from "@/modules/login/store";
import { throwPasswordError, throwOtpError } from "./validators";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS,
  LOGIN_STATUSES
} from "@/constants/enums";
import { LOGIN_OTP_CONFIG, MAGIC_LINK_CONFIG } from "@/constants/config";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";
import { loginHistoryService } from "@/modules/login-history/service/login-history.service";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const OTP_EXPIRY_SECONDS =
  LOGIN_OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
export const OTP_COOLDOWN_SECONDS = LOGIN_OTP_CONFIG.COOLDOWN_SECONDS;
export const MAGIC_LINK_EXPIRY_SECONDS =
  MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
export const MAGIC_LINK_COOLDOWN_SECONDS = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

// ──────────────────────────────────────────────
// Login history recording
// ──────────────────────────────────────────────

export const recordSuccessfulLogin = ({
  userId,
  usernameAttempted,
  loginMethod,
  req
}: {
  userId: Schema.Types.ObjectId | string;
  usernameAttempted: string;
  loginMethod: LoginMethod;
  req: Request;
}): void => {
  loginHistoryService.logLoginAttempt({
    userId: userId.toString(),
    usernameAttempted,
    status: LOGIN_STATUSES.SUCCESS,
    loginMethod,
    req
  });
};

export const recordFailedLogin = ({
  userId,
  usernameAttempted,
  loginMethod,
  failReason,
  req
}: {
  userId?: Schema.Types.ObjectId | string | null;
  usernameAttempted: string;
  loginMethod: LoginMethod;
  failReason: LoginFailReason;
  req: Request;
}): void => {
  loginHistoryService.logLoginAttempt({
    userId: userId ? userId.toString() : null,
    usernameAttempted,
    status: LOGIN_STATUSES.FAILED,
    failReason,
    loginMethod,
    req
  });
};

export const completeSuccessfulLogin = ({
  email,
  auth,
  loginMethod,
  req
}: {
  email: string;
  auth: AuthenticationDocument;
  loginMethod: LoginMethod;
  req: Request;
}): LoginResponse => {
  recordSuccessfulLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod,
    req
  });

  Logger.info("Login successful", {
    email,
    userId: auth._id.toString(),
    method: loginMethod
  });

  return generateAuthTokensResponse({
    userId: auth._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles
  });
};

// ──────────────────────────────────────────────
// Password login helpers
// ──────────────────────────────────────────────

const trackFailedPasswordAttempt = async (
  email: string,
  auth: AuthenticationDocument,
  req: PasswordLoginRequest
): Promise<{ attemptCount: number; lockoutSeconds: number }> => {
  const { attemptCount, lockoutSeconds } =
    await failedAttemptsStore.trackAttempt(email);

  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
    req
  });

  Logger.warn("Login failed - invalid password", { email, attemptCount });
  return { attemptCount, lockoutSeconds };
};

export const verifyPasswordOrFail = async (
  auth: AuthenticationDocument,
  password: string,
  email: string,
  language: string,
  req: PasswordLoginRequest,
  t: PasswordLoginRequest["t"]
): Promise<void> => {
  const passwordValid = isValidHashedValue(password, auth.password);

  if (passwordValid) return;

  const { attemptCount, lockoutSeconds } = await trackFailedPasswordAttempt(
    email,
    auth,
    req
  );

  throwPasswordError(attemptCount, lockoutSeconds, language, t);
};

// ──────────────────────────────────────────────
// OTP helpers
// ──────────────────────────────────────────────

export const createAndStoreOtp = async (email: string): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, OTP_EXPIRY_SECONDS);

  Logger.debug("Login OTP created and stored", {
    email,
    expiresInSeconds: OTP_EXPIRY_SECONDS
  });

  return otp;
};

export const setOtpRateLimits = async (email: string): Promise<void> => {
  await Promise.all([
    otpStore.setCooldown(email, OTP_COOLDOWN_SECONDS),
    otpStore.incrementResendCount(email, OTP_EXPIRY_SECONDS)
  ]);

  Logger.debug("Login OTP rate limits applied", {
    email,
    cooldownSeconds: OTP_COOLDOWN_SECONDS
  });
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

export const handleInvalidOtp = async (
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction,
  req: OtpVerifyRequest
): Promise<never> => {
  const attempts = await trackFailedOtpAttempt(email, auth, req);
  return throwOtpError(attempts, t);
};

// ──────────────────────────────────────────────
// Magic link helpers
// ──────────────────────────────────────────────

export const createAndStoreToken = async (email: string): Promise<string> => {
  const token = magicLinkStore.createToken();

  await magicLinkStore.clearToken(email);
  await magicLinkStore.storeHashed(email, token, MAGIC_LINK_EXPIRY_SECONDS);

  Logger.debug("Magic link created and stored", {
    email,
    expiresInSeconds: MAGIC_LINK_EXPIRY_SECONDS
  });

  return token;
};

export const setMagicLinkCooldown = async (email: string): Promise<void> => {
  await magicLinkStore.setCooldown(email, MAGIC_LINK_COOLDOWN_SECONDS);

  Logger.debug("Magic link cooldown set", {
    email,
    cooldownSeconds: MAGIC_LINK_COOLDOWN_SECONDS
  });
};

export const handleInvalidMagicLink = (
  email: string,
  auth: AuthenticationDocument,
  req: MagicLinkVerifyRequest,
  t: TranslateFunction
): never => {
  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
    req
  });

  Logger.warn("Magic link verification failed - invalid token", { email });
  throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
};

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────

export const getClientIp = (req: {
  headers: Record<string, unknown>;
  ip?: string;
}): string => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp.trim();
  }

  return req.ip || "unknown";
};
