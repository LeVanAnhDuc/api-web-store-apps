import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  CompleteSignupRequest,
  CompleteSignupResponse,
  CheckEmailRequest,
  CheckEmailResponse
} from "@/types/modules/signup";
import { Logger } from "@/utils/logger";
import { generateAuthTokensResponse } from "@/utils/token";
import authenticationRepository from "@/repositories/authentication";
import { otpStore } from "@/modules/signup/store";
import {
  ensureEmailAvailable,
  ensureCooldownExpired,
  ensureCanResend,
  ensureOtpNotLocked,
  ensureSessionValid
} from "./validators";
import { sendSignupOtpEmail } from "./emails";
import {
  createAndStoreOtp,
  setOtpCooldown,
  trackResendAttempt,
  verifyOtp,
  createAndStoreSession,
  createUserAccount,
  cleanupSignupData,
  OTP_EXPIRY_SECONDS,
  OTP_COOLDOWN_SECONDS,
  MAX_RESEND_COUNT,
  MAX_FAILED_ATTEMPTS,
  SESSION_EXPIRY_SECONDS
} from "./helpers";
import { AUTHENTICATION_ROLES } from "@/constants/enums";

class SignupService {
  constructor(private readonly authRepo: typeof authenticationRepository) {}

  async sendOtp(
    req: SendOtpRequest
  ): Promise<Partial<ResponsePattern<SendOtpResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("SendOtp initiated", { email });

    await ensureCooldownExpired(email, t);
    await ensureEmailAvailable(email, t);

    const otp = await createAndStoreOtp(email, OTP_EXPIRY_SECONDS);

    await setOtpCooldown(email, OTP_COOLDOWN_SECONDS);

    sendSignupOtpEmail(email, otp, language as I18n.Locale);

    Logger.info("SendOtp completed", {
      email,
      expiresIn: OTP_EXPIRY_SECONDS,
      cooldownSeconds: OTP_COOLDOWN_SECONDS
    });

    return {
      message: t("signup:success.otpSent"),
      data: {
        success: true,
        expiresIn: OTP_EXPIRY_SECONDS,
        cooldownSeconds: OTP_COOLDOWN_SECONDS
      }
    };
  }

  async verifyOtp(
    req: VerifyOtpRequest
  ): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("VerifyOtp initiated", { email });

    await ensureOtpNotLocked(email, MAX_FAILED_ATTEMPTS, t);

    await verifyOtp(email, otp, t);

    const sessionToken = await createAndStoreSession(email);

    await otpStore.cleanupOtpData(email);

    Logger.info("VerifyOtp completed successfully", {
      email,
      sessionExpiresIn: SESSION_EXPIRY_SECONDS
    });

    return {
      message: t("signup:success.otpVerified"),
      data: {
        success: true,
        sessionToken,
        expiresIn: SESSION_EXPIRY_SECONDS
      }
    };
  }

  async resendOtp(
    req: ResendOtpRequest
  ): Promise<Partial<ResponsePattern<ResendOtpResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("ResendOtp initiated", { email });

    await ensureCooldownExpired(email, t);
    await ensureCanResend(email, MAX_RESEND_COUNT, t);
    await ensureEmailAvailable(email, t);

    const otp = await createAndStoreOtp(email, OTP_EXPIRY_SECONDS);

    await setOtpCooldown(email, OTP_COOLDOWN_SECONDS);

    const currentResendCount = await trackResendAttempt(email);

    sendSignupOtpEmail(email, otp, language as I18n.Locale);

    Logger.info("ResendOtp completed", {
      email,
      resendCount: currentResendCount,
      maxResends: MAX_RESEND_COUNT,
      expiresIn: OTP_EXPIRY_SECONDS
    });

    return {
      message: t("signup:success.otpResent"),
      data: {
        success: true,
        expiresIn: OTP_EXPIRY_SECONDS,
        cooldownSeconds: OTP_COOLDOWN_SECONDS,
        resendCount: currentResendCount,
        maxResends: MAX_RESEND_COUNT,
        remainingResends: MAX_RESEND_COUNT - currentResendCount
      }
    };
  }

  async completeSignup(
    req: CompleteSignupRequest
  ): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> {
    const { email, password, fullName, gender, dateOfBirth, sessionToken } =
      req.body;
    const { t } = req;

    Logger.info("CompleteSignup initiated", { email });

    await ensureSessionValid(email, sessionToken, t);
    await ensureEmailAvailable(email, t);

    const account = await createUserAccount(
      email,
      password,
      fullName,
      gender,
      dateOfBirth
    );

    const tokens = generateAuthTokensResponse({
      userId: account.userId.toString(),
      authId: account.authId.toString(),
      email: account.email,
      roles: AUTHENTICATION_ROLES.USER
    });

    await cleanupSignupData(email);

    Logger.info("CompleteSignup finished - new user registered", {
      email,
      userId: account.userId.toString()
    });

    return {
      message: t("signup:success.signupCompleted"),
      data: {
        success: true,
        user: {
          id: account.userId.toString(),
          email: account.email,
          fullName: account.fullName
        },
        tokens
      }
    };
  }

  async checkEmail(
    req: CheckEmailRequest
  ): Promise<Partial<ResponsePattern<CheckEmailResponse>>> {
    const { email } = req.params;

    Logger.info("CheckEmail initiated", { email });

    const exists = await this.authRepo.emailExists(email);

    Logger.info("CheckEmail completed", { email });

    return {
      data: {
        available: !exists
      }
    };
  }
}

export const signupService = new SignupService(authenticationRepository);
