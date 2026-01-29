import type { TFunction } from "i18next";
import type { SendOtpRequest, SendOtpResponse } from "@/modules/signup/types";
import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { isEmailRegistered } from "@/modules/signup/repository";
import { otpStore } from "@/modules/signup/store";
import { sendModuleEmail } from "@/app/utils/email/sender";
import { OTP_CONFIG } from "@/modules/signup/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";

const TIME_OTP_EXPIRES = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_OTP_RESEND = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;

const ensureEmailAvailable = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Signup attempt with existing email", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

const createAndStoreOtp = async (email: string): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, TIME_OTP_EXPIRES);

  Logger.debug("OTP created and stored", {
    email,
    expiresInSeconds: TIME_OTP_EXPIRES
  });

  return otp;
};

const setOtpCooldown = async (email: string): Promise<void> => {
  await otpStore.setCooldown(email, TIME_OTP_RESEND);

  Logger.debug("OTP cooldown set", {
    email,
    cooldownSeconds: TIME_OTP_RESEND
  });
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

export const sendOtpService = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("SendOtp initiated", { email });

  const canSend = await otpStore.checkCooldown(email);
  if (!canSend) {
    Logger.warn("OTP cooldown not expired", { email });
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }

  await ensureEmailAvailable(email, t);

  const otp = await createAndStoreOtp(email);

  await setOtpCooldown(email);

  sendSignupOtpEmail(email, otp, language as I18n.Locale);

  Logger.info("SendOtp completed", {
    email,
    expiresIn: TIME_OTP_EXPIRES,
    cooldownSeconds: TIME_OTP_RESEND
  });

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: TIME_OTP_EXPIRES,
      cooldownSeconds: TIME_OTP_RESEND
    }
  };
};
