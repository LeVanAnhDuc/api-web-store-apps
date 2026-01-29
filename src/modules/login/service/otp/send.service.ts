import type { TFunction } from "i18next";
import type { OtpSendRequest, OtpSendResponse } from "@/modules/login/types";
import { BadRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { otpStore } from "@/modules/login/store";
import {
  ensureCooldownExpired,
  validateAuthenticationForLogin
} from "../validators";
import { sendModuleEmail } from "@/app/utils/email/sender";
import { LOGIN_OTP_CONFIG } from "@/modules/login/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";

const OTP_EXPIRY_SECONDS = LOGIN_OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const OTP_COOLDOWN_SECONDS = LOGIN_OTP_CONFIG.COOLDOWN_SECONDS;

const ensureCanResend = async (email: string, t: TFunction): Promise<void> => {
  const exceeded = await otpStore.hasExceededResendLimit(email);

  if (exceeded) {
    Logger.warn("Login OTP resend limit exceeded", { email });
    throw new BadRequestError(t("login:errors.otpResendLimitExceeded"));
  }
};

const createAndStoreOtp = async (email: string): Promise<string> => {
  const otp = otpStore.createOtp();

  await otpStore.clearOtp(email);
  await otpStore.storeHashed(email, otp, OTP_EXPIRY_SECONDS);

  Logger.debug("Login OTP created and stored", {
    email,
    expiresInSeconds: OTP_EXPIRY_SECONDS
  });

  return otp;
};

const setOtpRateLimits = async (email: string): Promise<void> => {
  await Promise.all([
    otpStore.setCooldown(email, OTP_COOLDOWN_SECONDS),
    otpStore.incrementResendCount(email, OTP_EXPIRY_SECONDS)
  ]);

  Logger.debug("Login OTP rate limits applied", {
    email,
    cooldownSeconds: OTP_COOLDOWN_SECONDS
  });
};

const sendLoginOtpEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  sendModuleEmail("login", email, locale, {
    templateName: "login-otp",
    subject: "Login Verification Code",
    variables: {
      otp,
      expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Login OTP email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};

export const sendLoginOtpService = async (
  req: OtpSendRequest
): Promise<Partial<ResponsePattern<OtpSendResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("Login OTP send initiated", { email });

  await ensureCooldownExpired(
    otpStore,
    email,
    language,
    "Login OTP cooldown not expired",
    "login:errors.otpCooldown"
  );
  await validateAuthenticationForLogin(email, t);
  await ensureCanResend(email, t);

  const otp = await createAndStoreOtp(email);

  withRetry(() => setOtpRateLimits(email), {
    operationName: "setOtpRateLimits",
    context: { email }
  });

  sendLoginOtpEmail(email, otp, language as I18n.Locale);

  Logger.info("Login OTP send completed", {
    email,
    expiresIn: OTP_EXPIRY_SECONDS,
    cooldown: OTP_COOLDOWN_SECONDS
  });

  return {
    message: t("login:success.otpSent"),
    data: {
      success: true,
      expiresIn: OTP_EXPIRY_SECONDS,
      cooldown: OTP_COOLDOWN_SECONDS
    }
  };
};
