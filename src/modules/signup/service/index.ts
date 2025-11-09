// libs
import type { Request } from "express";
// types
import type { SendOtpResponse } from "@/shared/types/modules/signup";
import type { Locale } from "@/shared/locales";
// models
import AuthModel from "@/modules/auth/model";
// utils
import { generateOtp, generateSessionId } from "@/modules/signup/utils/otp";
import { Logger } from "@/core/utils/logger";
import { getMessage } from "@/core/helpers/i18n";
import {
  checkIpRateLimit,
  checkEmailRateLimit,
  checkOtpCooldown,
  setOtpCooldown
} from "@/shared/utils/rate-limit";
// services
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
// responses
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
// constants
import { OTP_CONFIG, SIGNUP_RATE_LIMITS } from "@/shared/constants/signup";
import { EMAIL_TRANSLATIONS } from "@/shared/templates/locales";

const SECONDS_PER_MINUTE = 60;
const UNKNOWN_IP = "unknown";

const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || UNKNOWN_IP;
};

export const sendOtpEmail = async (
  email: string,
  otp: string,
  locale: Locale
): Promise<void> => {
  const subject = EMAIL_TRANSLATIONS[locale].EMAIL_SUBJECTS.title;

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
  locale: Locale
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
    const message = getMessage("SIGNUP.ERRORS.RATE_LIMIT_EXCEEDED", locale);
    throw new BadRequestError(message);
  }
};

const checkAndSetOtpCooldown = async (
  email: string,
  locale: Locale
): Promise<void> => {
  const canSend = await checkOtpCooldown(email);

  if (!canSend) {
    const message = getMessage("SIGNUP.ERRORS.RESEND_COOLDOWN", locale);
    throw new BadRequestError(message);
  }

  await setOtpCooldown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
};

const checkEmailAvailability = async (
  email: string,
  ipAddress: string,
  locale: Locale
): Promise<void> => {
  const existingUser = await AuthModel.findOne({ email });

  if (existingUser) {
    const message = getMessage("SIGNUP.ERRORS.EMAIL_ALREADY_EXISTS", locale);
    throw new ConflictRequestError(message);
  }
};

const createOtpVerification = () => {
  const otp = generateOtp();
  const sessionId = generateSessionId();

  return { otp, sessionId };
};

export const sendOtp = async (
  req: Request
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const ipAddress = getClientIp(req);
  const { locale } = req;

  await checkRateLimits(ipAddress, email, locale);
  await checkAndSetOtpCooldown(email, locale);
  await checkEmailAvailability(email, ipAddress, locale);

  const { otp, sessionId } = createOtpVerification();

  sendOtpEmail(email, otp, locale)
    .then(() => Logger.info(`OTP sent successfully to ${email}`))
    .catch((error) =>
      Logger.error(`Background email sending failed for ${email}`, error)
    );

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: getMessage("SIGNUP.SUCCESS.OTP_SENT", locale),
    data: {
      success: true,
      sessionId,
      expiresIn: expiresInSeconds
    }
  };
};
