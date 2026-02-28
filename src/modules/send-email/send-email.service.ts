import { render } from "@react-email/render";
import { Logger } from "@/utils/logger";
import type { EmailTransport } from "@/services/EmailTransport";
import {
  EmailType,
  type SendEmailOptions,
  type LoginOtpData,
  type SignupOtpData,
  type MagicLinkData,
  type UnlockTempPasswordData
} from "./send-email.types";
import { getEmailT } from "./send-email.i18n";
import { LoginOtpEmail } from "./templates/login-otp";
import { SignupOtpEmail } from "./templates/signup-otp";
import { MagicLinkEmail } from "./templates/magic-link";
import { UnlockTempPasswordEmail } from "./templates/unlock-temp-password";

export class SendEmailService {
  constructor(private readonly transport: EmailTransport) {}

  send<T extends EmailType>(type: T, options: SendEmailOptions<T>): void {
    this.sendAsync(type, options).catch((error) => {
      Logger.error(`${type} email delivery failed`, {
        email: options.email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
  }

  private async sendAsync<T extends EmailType>(
    type: T,
    options: SendEmailOptions<T>
  ): Promise<void> {
    const htmlContent = await this.renderTemplate(type, options);
    const subject = this.getSubject(type, options.locale);

    await this.transport.sendRawEmail({
      to: options.email,
      subject,
      htmlContent
    });

    Logger.info(`${type} email sent successfully`, { email: options.email });
  }

  private async renderTemplate<T extends EmailType>(
    type: T,
    options: SendEmailOptions<T>
  ): Promise<string> {
    const { locale } = options;

    switch (type) {
      case EmailType.LOGIN_OTP:
        return render(LoginOtpEmail(options.data as LoginOtpData, locale));
      case EmailType.SIGNUP_OTP:
        return render(SignupOtpEmail(options.data as SignupOtpData, locale));
      case EmailType.MAGIC_LINK:
        return render(MagicLinkEmail(options.data as MagicLinkData, locale));
      case EmailType.UNLOCK_TEMP_PASSWORD:
        return render(
          UnlockTempPasswordEmail(
            options.data as UnlockTempPasswordData,
            locale
          )
        );
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }

  private getSubject(type: EmailType, locale?: I18n.Locale): string {
    const strings = getEmailT(locale);

    switch (type) {
      case EmailType.LOGIN_OTP:
        return strings.loginOtp.title;
      case EmailType.SIGNUP_OTP:
        return strings.signupOtp.title;
      case EmailType.MAGIC_LINK:
        return strings.magicLink.title;
      case EmailType.UNLOCK_TEMP_PASSWORD:
        return strings.unlockTempPassword.title;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }
}
