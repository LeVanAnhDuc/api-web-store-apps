import type { TFunction } from "i18next";
import type {
  ResendOtpRequest,
  ResendOtpResponse
} from "@/modules/signup/types";
import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { isEmailRegistered } from "@/modules/signup/repository";
import { otpStore } from "@/modules/signup/store";
import { sendModuleEmail } from "@/app/utils/email/sender";
import { OTP_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE, MINUTES_PER_HOUR } from "@/app/constants/time";

const TIME_OTP_EXPIRES = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_OTP_RESEND = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;
const TIME_RESEND_OTP_PER_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const MAX_RESEND_COUNT = OTP_CONFIG.MAX_RESEND_COUNT;

const ensureCanResend = async (email: string, t: TFunction): Promise<void> => {
  const exceeded = await otpStore.hasExceededResendLimit(
    email,
    MAX_RESEND_COUNT
  );

  if (exceeded) {
    Logger.warn("Resend OTP limit exceeded", {
      email,
      maxResends: MAX_RESEND_COUNT
    });
    throw new BadRequestError(t("signup:errors.resendLimitExceeded"));
  }
};

const ensureEmailAvailable = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Resend OTP attempt with existing email", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

const createAndStoreOtp = async (email: string): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, TIME_OTP_EXPIRES);

  Logger.debug("OTP created for resend", {
    email,
    expiresInSeconds: TIME_OTP_EXPIRES
  });

  return otp;
};

const setOtpCooldown = async (email: string): Promise<void> => {
  await otpStore.setCooldown(email, TIME_OTP_RESEND);

  Logger.debug("Resend cooldown set", {
    email,
    cooldownSeconds: TIME_OTP_RESEND
  });
};

const trackResendAttempt = async (email: string): Promise<number> => {
  const count = await otpStore.incrementResendCount(
    email,
    TIME_RESEND_OTP_PER_HOUR
  );

  Logger.debug("Resend attempt tracked", {
    email,
    currentCount: count,
    maxResends: MAX_RESEND_COUNT,
    windowSeconds: TIME_RESEND_OTP_PER_HOUR
  });

  return count;
};

const sendSignupOtpEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  sendModuleEmail("signup", email, locale, {
    templateName: "signup-otp",
    subject: "Signup Verification Code",
    variables: {
      otp,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Signup OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};

export const resendOtpService = async (
  req: ResendOtpRequest
): Promise<Partial<ResponsePattern<ResendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("ResendOtp initiated", { email });

  const canSend = await otpStore.checkCooldown(email);
  if (!canSend) {
    Logger.warn("Resend OTP cooldown not expired", { email });
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }

  await ensureCanResend(email, t);
  await ensureEmailAvailable(email, t);

  const otp = await createAndStoreOtp(email);

  await setOtpCooldown(email);

  const currentResendCount = await trackResendAttempt(email);

  sendSignupOtpEmail(email, otp, language as I18n.Locale);

  Logger.info("ResendOtp completed", {
    email,
    resendCount: currentResendCount,
    maxResends: MAX_RESEND_COUNT,
    expiresIn: TIME_OTP_EXPIRES
  });

  return {
    message: t("signup:success.otpResent"),
    data: {
      success: true,
      expiresIn: TIME_OTP_EXPIRES,
      cooldownSeconds: TIME_OTP_RESEND,
      resendCount: currentResendCount,
      maxResends: MAX_RESEND_COUNT,
      remainingResends: MAX_RESEND_COUNT - currentResendCount
    }
  };
};
