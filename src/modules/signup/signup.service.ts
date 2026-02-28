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
import type { Gender } from "@/types/modules/user";
import type { Schema } from "mongoose";
import { Logger } from "@/utils/logger";
import { generateAuthTokensResponse } from "@/utils/token";
import { hashValue } from "@/utils/crypto/bcrypt";
import {
  BadRequestError,
  ConflictRequestError
} from "@/configurations/responses/error";
import type authenticationRepository from "@/repositories/authentication";
import type userRepository from "@/repositories/user";
import type { OtpSignupRepository } from "./repositories/otp-signup.repository";
import type { SessionSignupRepository } from "./repositories/session-signup.repository";
import {
  sendEmailService,
  EmailType
} from "@/modules/send-email/send-email.module";
import { AUTHENTICATION_ROLES } from "@/constants/enums";
import { OTP_CONFIG, SESSION_CONFIG } from "@/constants/config";
import {
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR
} from "@/constants/infrastructure";

const OTP_EXPIRY_SECONDS = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const OTP_COOLDOWN_SECONDS = OTP_CONFIG.RESEND_COOLDOWN_SECONDS;
const RESEND_WINDOW_SECONDS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const MAX_RESEND_COUNT = OTP_CONFIG.MAX_RESEND_COUNT;
const MAX_FAILED_ATTEMPTS = OTP_CONFIG.MAX_FAILED_ATTEMPTS;
const LOCKOUT_DURATION_MINUTES = OTP_CONFIG.LOCKOUT_DURATION_MINUTES;
const SESSION_EXPIRY_SECONDS =
  SESSION_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

export class SignupService {
  constructor(
    private readonly authRepo: typeof authenticationRepository,
    private readonly userRepo: typeof userRepository,
    private readonly otpSignupRepo: OtpSignupRepository,
    private readonly sessionSignupRepo: SessionSignupRepository
  ) {}

  async sendOtp(
    req: SendOtpRequest
  ): Promise<Partial<ResponsePattern<SendOtpResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("SendOtp initiated", { email });

    await this.ensureCooldownExpired(email, t);
    await this.ensureEmailAvailable(email, t);

    const otp = await this.createAndStoreOtp(email, OTP_EXPIRY_SECONDS);

    await this.otpSignupRepo.setCooldown(email, OTP_COOLDOWN_SECONDS);

    sendEmailService.send(EmailType.SIGNUP_OTP, {
      email,
      data: { otp, expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

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

    const isLocked = await this.otpSignupRepo.isLocked(
      email,
      MAX_FAILED_ATTEMPTS
    );
    if (isLocked) {
      Logger.warn("OTP account locked", {
        email,
        maxAttempts: MAX_FAILED_ATTEMPTS
      });
      throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
    }

    await this.verifyOtpOrFail(email, otp, t);

    const sessionToken = await this.createAndStoreSession(email);

    await this.otpSignupRepo.cleanupOtpData(email);

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

    await this.ensureCooldownExpired(email, t);

    const exceeded = await this.otpSignupRepo.hasExceededResendLimit(
      email,
      MAX_RESEND_COUNT
    );
    if (exceeded) {
      Logger.warn("Resend OTP limit exceeded", {
        email,
        maxResends: MAX_RESEND_COUNT
      });
      throw new BadRequestError(t("signup:errors.resendLimitExceeded"));
    }

    await this.ensureEmailAvailable(email, t);

    const otp = await this.createAndStoreOtp(email, OTP_EXPIRY_SECONDS);

    await this.otpSignupRepo.setCooldown(email, OTP_COOLDOWN_SECONDS);

    const currentResendCount = await this.otpSignupRepo.incrementResendCount(
      email,
      RESEND_WINDOW_SECONDS
    );
    Logger.debug("Resend attempt tracked", {
      email,
      currentCount: currentResendCount,
      maxResends: MAX_RESEND_COUNT,
      windowSeconds: RESEND_WINDOW_SECONDS
    });

    sendEmailService.send(EmailType.SIGNUP_OTP, {
      email,
      data: { otp, expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

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

    const isValid = await this.sessionSignupRepo.verify(email, sessionToken);
    if (!isValid) {
      Logger.warn("Invalid or expired signup session", { email });
      throw new BadRequestError(t("signup:errors.invalidSession"));
    }

    await this.ensureEmailAvailable(email, t);

    const account = await this.createUserAccount(
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

    await Promise.all([
      this.otpSignupRepo.cleanupOtpData(email),
      this.sessionSignupRepo.clear(email)
    ]);
    Logger.debug("Signup data cleaned up", { email });

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

  // ──────────────────────────────────────────────
  // Validators
  // ──────────────────────────────────────────────

  private async ensureEmailAvailable(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const exists = await this.authRepo.emailExists(email);

    if (exists) {
      Logger.warn("Email already exists", { email });
      throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
    }
  }

  private async ensureCooldownExpired(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const canSend = await this.otpSignupRepo.checkCooldown(email);

    if (!canSend) {
      const remaining = await this.otpSignupRepo.getCooldownRemaining(email);
      Logger.warn("OTP cooldown not expired", { email, remaining });
      throw new BadRequestError(
        t("signup:errors.resendCoolDown", { seconds: remaining })
      );
    }
  }

  // ──────────────────────────────────────────────
  // OTP helpers
  // ──────────────────────────────────────────────

  private async createAndStoreOtp(
    email: string,
    expirySeconds: number
  ): Promise<string> {
    const otp = this.otpSignupRepo.createOtp();

    await this.otpSignupRepo.clearOtp(email);
    await this.otpSignupRepo.storeHashed(email, otp, expirySeconds);

    Logger.debug("OTP created and stored", {
      email,
      expiresInSeconds: expirySeconds
    });

    return otp;
  }

  private async verifyOtpOrFail(
    email: string,
    otp: string,
    t: TranslateFunction
  ): Promise<void> {
    const isValid = await this.otpSignupRepo.verify(email, otp);

    if (!isValid) {
      const failedCount = await this.otpSignupRepo.incrementFailedAttempts(
        email,
        LOCKOUT_DURATION_MINUTES
      );
      Logger.warn("Invalid OTP attempt", {
        email,
        failedCount,
        lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES
      });

      const remaining = MAX_FAILED_ATTEMPTS - failedCount;

      if (remaining > 0) {
        throw new BadRequestError(
          t("signup:errors.invalidOtpWithRemaining", { remaining })
        );
      }

      throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
    }
  }

  private async createAndStoreSession(email: string): Promise<string> {
    const sessionToken = this.sessionSignupRepo.createToken();

    await this.sessionSignupRepo.store(
      email,
      sessionToken,
      SESSION_EXPIRY_SECONDS
    );

    Logger.debug("Signup session created", {
      email,
      expiresInSeconds: SESSION_EXPIRY_SECONDS
    });

    return sessionToken;
  }

  // ──────────────────────────────────────────────
  // Account creation
  // ──────────────────────────────────────────────

  private async createUserAccount(
    email: string,
    password: string,
    fullName: string,
    gender: Gender,
    dateOfBirth: string
  ): Promise<{
    authId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    email: string;
    fullName: string;
  }> {
    const hashedPassword = hashValue(password);
    const auth = await this.authRepo.create({ email, hashedPassword });
    Logger.debug("Auth record created", {
      email,
      authId: auth._id.toString()
    });

    const user = await this.userRepo.createProfile({
      authId: auth._id,
      fullName,
      gender,
      dateOfBirth: new Date(dateOfBirth)
    });
    Logger.info("User profile created", {
      userId: user._id.toString(),
      authId: auth._id.toString()
    });

    return { authId: auth._id, userId: user._id, email, fullName };
  }
}
