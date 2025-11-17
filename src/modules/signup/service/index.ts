import type { Request } from "express";
import type { TFunction } from "i18next";
import type {
  CompleteSignupResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  CompleteSignupRequest
} from "@/shared/types/modules/signup";
import AuthModel from "@/modules/auth/model";
import UserModel from "@/modules/user/model";
import { generateOtp, generateSessionId } from "@/modules/signup/utils/otp";
import { Logger } from "@/core/utils/logger";
import i18next from "@/i18n";
import {
  checkIpRateLimit,
  checkEmailRateLimit,
  checkOtpCoolDown,
  setOtpCoolDown,
  createAndStoreOtp,
  checkOtpExists,
  deleteOtp,
  storeSession,
  verifySession,
  isOtpAccountLocked,
  incrementFailedOtpAttempts,
  cleanupOtpData,
  cleanupSignupSession
} from "@/modules/signup/utils/store";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import {
  BadRequestError,
  ConflictRequestError,
  TooManyRequestsError
} from "@/core/responses/error";
import { OTP_CONFIG, SIGNUP_RATE_LIMITS } from "@/shared/constants/signup";
import { hashPasswordAsync } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";
import { AUTH_ROLES } from "@/shared/constants/auth";
import { TOKEN_EXPIRY } from "@/core/configs/jwt";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

const UNKNOWN_IP = "unknown";

/*
 * Services for signup
 */

export const sendOtp = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  const ipAddress = getClientIp(req);

  await checkRateLimits(ipAddress, email, t);
  await checkAndSetOtpCoolDown(email, t);
  await checkEmailAvailability(email, t);

  const otp = generateOtp();

  await checkAndCreateOtp(
    email,
    otp,
    OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE
  );

  sendOtpEmail(email, otp, language as I18n.Locale)
    .then(() => Logger.info(`OTP sent successfully to ${email}`))
    .catch((error) =>
      Logger.error(`Background email sending failed for ${email}`, error)
    );

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: expiresInSeconds
    }
  };
};

export const verifyOtp = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  await checkMatchOtp(email, otp, t, language);

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
  const sessionId = generateSessionId();

  await storeSession(email, sessionId, expiresInSeconds);

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionId,
      expiresIn: expiresInSeconds
    }
  };
};

export const completeSignup = async (
  req: CompleteSignupRequest
): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> => {
  const { email, password, fullName, gender, birthday, sessionId } = req.body;
  const { t } = req;

  await checkSessionValidity(email, sessionId, t);
  await checkEmailAvailability(email, t);

  const hashedPassword = await hashPasswordAsync(password);

  const auth = await AuthModel.create({
    email,
    password: hashedPassword,
    verifiedEmail: true,
    roles: AUTH_ROLES.USER
  });

  const user = await UserModel.create({
    authId: auth._id,
    fullName,
    gender,
    dateOfBirth: new Date(birthday)
  });

  const { accessToken, refreshToken, idToken } = generatePairToken({
    userId: user._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles
  });

  await AuthModel.findByIdAndUpdate(auth._id, { refreshToken });

  await cleanupSignupSession(email);

  return {
    message: t("signup:success.signupCompleted"),
    data: {
      success: true,
      message: t("signup:success.signupCompleted"),
      data: {
        accessToken,
        refreshToken,
        idToken,
        expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
      }
    }
  };
};

/*
 * Helpers --------------------------------------------------------------------------------------------------------------
 */

const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || UNKNOWN_IP;
};

const sendOtpEmail = async (
  email: string,
  otp: string,
  locale: I18n.Locale
): Promise<void> => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.otpVerification");

  await sendTemplatedEmail(
    email,
    subject,
    "otp-verification",
    {
      otp,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    },
    locale
  );
};

const checkRateLimits = async (
  ipAddress: string,
  email: string,
  t: TFunction
): Promise<void> => {
  const [isIpAllowed, isEmailAllowed] = await Promise.all([
    checkIpRateLimit(
      ipAddress,
      SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.MAX_REQUESTS,
      SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.WINDOW_SECONDS
    ),
    checkEmailRateLimit(
      email,
      SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.MAX_REQUESTS,
      SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.WINDOW_SECONDS
    )
  ]);

  if (!isIpAllowed || !isEmailAllowed) {
    throw new TooManyRequestsError(t("signup:errors.rateLimitExceeded"));
  }
};

const checkAndSetOtpCoolDown = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCoolDown(email);

  if (!canSend) {
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }

  await setOtpCoolDown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
};

const checkEmailAvailability = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const existingUser = await AuthModel.findOne({ email });

  if (existingUser) {
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

const checkSessionValidity = async (
  email: string,
  sessionId: string,
  t: TFunction
): Promise<void> => {
  const isValid = await verifySession(email, sessionId);

  if (!isValid) {
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};

const checkAndCreateOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, expireTime);
};

const checkMatchOtp = async (
  email: string,
  otp: string,
  t: TFunction,
  language: string
): Promise<void> => {
  // Check if account is locked due to too many failed attempts
  const isLocked = await isOtpAccountLocked(
    email,
    OTP_CONFIG.MAX_FAILED_ATTEMPTS
  );

  if (isLocked) {
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }

  const isOtpValid = await checkOtpExists(email, otp);

  if (!isOtpValid) {
    // Increment failed attempts counter
    const failedCount = await incrementFailedOtpAttempts(
      email,
      OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    );
    const remainingAttempts = OTP_CONFIG.MAX_FAILED_ATTEMPTS - failedCount;

    if (remainingAttempts > 0) {
      const errorMessage = i18next.t("signup:errors.invalidOtpWithRemaining", {
        remaining: remainingAttempts,
        lng: language
      });
      throw new BadRequestError(errorMessage);
    } else {
      throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
    }
  }

  // Clear all OTP-related data on successful verification
  await cleanupOtpData(email);
};
