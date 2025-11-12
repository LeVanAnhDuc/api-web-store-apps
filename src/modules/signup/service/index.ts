import type { Request } from "express";
import type { TFunction } from "i18next";

import type { SendOtpResponse } from "@/shared/types/modules/signup";
import AuthModel from "@/modules/auth/model";
import { generateOtp, generateSessionId } from "@/modules/signup/utils/otp";
import { Logger } from "@/core/utils/logger";
import i18next from "@/i18n";
import {
  checkIpRateLimit,
  checkEmailRateLimit,
  checkOtpCooldown,
  setOtpCooldown
} from "@/shared/utils/rate-limit";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import { OTP_CONFIG, SIGNUP_RATE_LIMITS } from "@/shared/constants/signup";

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
    throw new BadRequestError(t("signup:errors.rateLimitExceeded"));
  }
};

const checkAndSetOtpCooldown = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCooldown(email);

  if (!canSend) {
    throw new BadRequestError(t("signup:errors.resendCooldown"));
  }

  await setOtpCooldown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
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
  const { language, t } = req;

  await checkRateLimits(ipAddress, email, t);
  await checkAndSetOtpCooldown(email, t);
  await checkEmailAvailability(email, t);

  const { otp, sessionId } = createOtpVerification();

  sendOtpEmail(email, otp, language as I18n.Locale)
    .then(() => Logger.info(`OTP sent successfully to ${email}`))
    .catch((error) =>
      Logger.error(`Background email sending failed for ${email}`, error)
    );

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  const responseMessage = t("signup:success.otpSent");

  return {
    message: responseMessage,
    data: {
      success: true,
      sessionId,
      expiresIn: expiresInSeconds
    }
  };
};
