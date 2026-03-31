// libs
import { render } from "@react-email/render";
// types
import type { EmailTransport } from "@/services/cores/NodemailerTransport";
import type {
  ForgotPasswordOtpData,
  LoginOtpData,
  MagicLinkData,
  SendEmailOptions,
  SignupOtpData,
  UnlockTempPasswordData
} from "./email.types";
// others
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { CircuitBreaker, CircuitOpenError } from "@/utils/circuit-breaker";
import { EmailType } from "./email.types";
import { getEmailT } from "./email.helper";
import { LoginOtpEmail } from "./templates/login-otp";
import { SignupOtpEmail } from "./templates/signup-otp";
import { MagicLinkEmail } from "./templates/magic-link";
import { UnlockTempPasswordEmail } from "./templates/unlock-temp-password";
import { ForgotPasswordOtpEmail } from "./templates/forgot-password-otp";

const CIRCUIT_BREAKER_CONFIG = {
  FAILURE_THRESHOLD: 5,
  RESET_TIMEOUT_MS: 30000
} as const;

export class SendEmailService {
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly transport: EmailTransport) {
    this.circuitBreaker = new CircuitBreaker({
      name: "email-smtp",
      failureThreshold: CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD,
      resetTimeoutMs: CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS
    });
  }

  send<T extends EmailType>(type: T, options: SendEmailOptions<T>): void {
    withRetry(
      () => this.circuitBreaker.execute(() => this.sendAsync(type, options)),
      {
        maxAttempts: 3,
        initialDelayMs: 2000,
        operationName: `email:${type}`,
        context: { email: options.email },
        shouldRetry: (error) => !(error instanceof CircuitOpenError)
      }
    );
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
      case EmailType.FORGOT_PASSWORD_OTP:
        return render(
          ForgotPasswordOtpEmail(options.data as ForgotPasswordOtpData, locale)
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
      case EmailType.FORGOT_PASSWORD_OTP:
        return strings.forgotPasswordOtp.title;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }
}
