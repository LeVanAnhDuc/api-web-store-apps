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
  deleteOtpCoolDown,
  deleteOtp,
  storeSession,
  verifySession,
  deleteSession
} from "@/modules/signup/utils/store";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import { OTP_CONFIG, SIGNUP_RATE_LIMITS } from "@/shared/constants/signup";
import { hashPasswordAsync } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";
import { AUTH_ROLES } from "@/shared/constants/auth";
import { TOKEN_EXPIRY } from "@/core/configs/jwt";

const SECONDS_PER_MINUTE = 60;
const UNKNOWN_IP = "unknown";

/*
 * Services for signup
 */

export const sendOtp = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  // await checkRateLimits(ipAddress, email, t);
  // await checkAndSetOtpCoolDown(email, t);
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
  const { t } = req;

  await checkMatchOtp(email, otp, t);

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

  await deleteOtp(email);
  await deleteSession(email);

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

const _getClientIp = (req: Request): string => {
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

const _checkRateLimits = async (
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
    throw new BadRequestError(t("signup:errors.rateLimitExceeded"));
  }
};

const _checkAndSetOtpCoolDown = async (
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
  t: TFunction
): Promise<void> => {
  const isOtpValid = await checkOtpExists(email, otp);

  if (!isOtpValid) throw new BadRequestError(t("signup:errors.invalidOtp"));

  await deleteOtp(email);
  await deleteOtpCoolDown(email);
};
