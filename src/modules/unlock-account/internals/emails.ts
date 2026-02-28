import { Logger } from "@/utils/logger";
import { sendModuleEmail } from "@/utils/email/sender";
import ENV from "@/configurations/env";

export const sendUnlockEmail = (
  email: string,
  tempPassword: string,
  t: TranslateFunction,
  locale: I18n.Locale
): void => {
  const subject = t("unlockAccount:email.unlockSubject");

  sendModuleEmail("unlock-account", email, locale, {
    templateName: "unlock-temp-password",
    subject,
    variables: {
      subject,
      greeting: t("unlockAccount:email.unlockGreeting"),
      message: t("unlockAccount:email.unlockMessage"),
      passwordLabel: t("unlockAccount:email.tempPasswordLabel"),
      tempPassword,
      passwordExpiry: t("unlockAccount:email.tempPasswordExpiry"),
      securityWarning: t("unlockAccount:email.securityWarning"),
      loginButton: t("unlockAccount:email.loginButton"),
      loginUrl: ENV.CLIENT_URL || "http://localhost:3000/login",
      footer: t("unlockAccount:email.footer")
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Unlock email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};
