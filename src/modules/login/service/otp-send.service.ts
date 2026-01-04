import i18next from "@/i18n";
import type { TFunction } from "i18next";
import type {
  OtpSendRequest,
  OtpSendResponse
} from "@/shared/types/modules/login";
import { BadRequestError, UnauthorizedError } from "@/core/responses/error";
import { Logger } from "@/core/utils/logger";
import { findAuthByEmail } from "@/modules/login/repository";
import {
  checkLoginOtpCooldown,
  getLoginOtpCooldownRemaining,
  setLoginOtpCooldown,
  createAndStoreLoginOtp,
  deleteLoginOtp,
  incrementLoginOtpResendCount,
  hasExceededLoginOtpResendLimit
} from "@/modules/login/utils/store";
import { notifyLoginOtpByEmail } from "@/modules/login/notifier";
import { generateLoginOtp } from "@/modules/login/utils/otp";
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

const OTP_EXPIRY_SECONDS = LOGIN_OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const OTP_COOLDOWN_SECONDS = LOGIN_OTP_CONFIG.COOLDOWN_SECONDS;

const ensureCooldownExpired = async (
  email: string,
  language: string
): Promise<void> => {
  const canSend = await checkLoginOtpCooldown(email);

  if (!canSend) {
    const remaining = await getLoginOtpCooldownRemaining(email);
    Logger.warn("Login OTP cooldown not expired", { email, remaining });
    throw new BadRequestError(
      i18next.t("login:errors.otpCooldown", {
        seconds: remaining,
        lng: language
      })
    );
  }
};

const ensureEmailExists = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("Login OTP requested for non-existent email", { email });
    throw new UnauthorizedError(t("login:errors.invalidEmail"));
  }

  if (!auth.isActive) {
    Logger.warn("Login OTP requested for inactive account", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }

  if (!auth.verifiedEmail) {
    Logger.warn("Login OTP requested for unverified email", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }
};

const ensureResendLimitNotExceeded = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exceeded = await hasExceededLoginOtpResendLimit(email);

  if (exceeded) {
    Logger.warn("Login OTP resend limit exceeded", { email });
    throw new BadRequestError(t("login:errors.otpResendLimitExceeded"));
  }
};

const createNewOtp = async (email: string): Promise<string> => {
  const otp = generateLoginOtp();

  // Ensure idempotency by deleting existing OTP first
  await deleteLoginOtp(email);
  await createAndStoreLoginOtp(email, otp, OTP_EXPIRY_SECONDS);

  Logger.debug("Login OTP created and stored", {
    email,
    expiresInSeconds: OTP_EXPIRY_SECONDS
  });

  return otp;
};

const applyOtpRateLimits = async (email: string): Promise<void> => {
  await Promise.all([
    setLoginOtpCooldown(email, OTP_COOLDOWN_SECONDS),
    incrementLoginOtpResendCount(email, OTP_EXPIRY_SECONDS)
  ]);

  Logger.debug("Login OTP rate limits applied", {
    email,
    cooldownSeconds: OTP_COOLDOWN_SECONDS
  });
};

export const sendLoginOtp = async (
  req: OtpSendRequest
): Promise<Partial<ResponsePattern<OtpSendResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("Login OTP send initiated", { email });

  await ensureCooldownExpired(email, language);
  await ensureEmailExists(email, t);
  await ensureResendLimitNotExceeded(email, t);

  const otp = await createNewOtp(email);

  await applyOtpRateLimits(email);

  notifyLoginOtpByEmail(email, otp, language as I18n.Locale);

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
