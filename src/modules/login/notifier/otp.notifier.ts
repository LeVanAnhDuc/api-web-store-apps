import i18next from "@/i18n";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import { Logger } from "@/core/utils/logger";
import { withRetry } from "@/core/utils/retry";
import { LOGIN_OTP_CONFIG } from "@/shared/constants/modules/session";

export const notifyLoginOtpByEmail = (
  email: string,
  otp: string,
  locale: I18n.Locale
): void => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.loginOtp");

  withRetry(
    () =>
      sendTemplatedEmail(
        email,
        subject,
        "login-otp",
        {
          otp,
          expiryMinutes: LOGIN_OTP_CONFIG.EXPIRY_MINUTES
        },
        locale
      ),
    {
      operationName: "Login OTP email delivery",
      context: { email }
    }
  );

  Logger.info("Login OTP email queued for delivery", { email });
};
