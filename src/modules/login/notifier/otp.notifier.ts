import { sendLoginOtpEmail } from "@/modules/login/email/send-login-otp-email";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";

export const notifyLoginOtpByEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  withRetry(() => sendLoginOtpEmail(email, otp, locale), {
    operationName: "Login OTP email delivery",
    context: { email }
  });

  Logger.info("Login OTP email queued for delivery", { email });
};
