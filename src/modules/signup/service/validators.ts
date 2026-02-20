import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";
import { Logger } from "@/utils/logger";
import { isEmailRegistered } from "@/modules/signup/repository";
import { otpStore, sessionStore } from "@/modules/signup/store";

export const ensureEmailAvailable = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Email already exists", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

export const ensureCooldownExpired = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const canSend = await otpStore.checkCooldown(email);

  if (!canSend) {
    const remaining = await otpStore.getCooldownRemaining(email);
    Logger.warn("OTP cooldown not expired", { email, remaining });
    throw new BadRequestError(
      t("signup:errors.resendCoolDown", { seconds: remaining })
    );
  }
};

export const ensureCanResend = async (
  email: string,
  maxResends: number,
  t: TranslateFunction
): Promise<void> => {
  const exceeded = await otpStore.hasExceededResendLimit(email, maxResends);

  if (exceeded) {
    Logger.warn("Resend OTP limit exceeded", {
      email,
      maxResends
    });
    throw new BadRequestError(t("signup:errors.resendLimitExceeded"));
  }
};

export const ensureOtpNotLocked = async (
  email: string,
  maxAttempts: number,
  t: TranslateFunction
): Promise<void> => {
  const isLocked = await otpStore.isLocked(email, maxAttempts);

  if (isLocked) {
    Logger.warn("OTP account locked", {
      email,
      maxAttempts
    });
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }
};

export const ensureSessionValid = async (
  email: string,
  sessionToken: string,
  t: TranslateFunction
): Promise<void> => {
  const isValid = await sessionStore.verify(email, sessionToken);

  if (!isValid) {
    Logger.warn("Invalid or expired signup session", { email });
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};
