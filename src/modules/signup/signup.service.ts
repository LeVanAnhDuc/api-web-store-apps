// libs
import mongoose from "mongoose";
// types
import type { EmailDispatcher } from "@/services/email/email.dispatcher";
import type { Gender } from "@/modules/user/types";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type {
  SendOtpBody,
  VerifyOtpBody,
  ResendOtpBody,
  CompleteSignupBody,
  CheckEmailParams
} from "./types";
import type { Schema } from "mongoose";
import type { Request } from "express";
import type {
  OtpSignupRepository,
  SessionSignupRepository
} from "./repositories";
import type {
  SendOtpDto,
  VerifyOtpDto,
  ResendOtpDto,
  CompleteSignupDto,
  CheckEmailDto
} from "./dtos";
import type { EmailAvailableGuard, CooldownGuard } from "./guards";
// common
import { BadRequestError, InternalServerError } from "@/common/exceptions";
// modules
import { generateAuthTokensResponse } from "@/modules/authentication/helpers";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";
// dtos
import {
  toSendOtpDto,
  toVerifyOtpDto,
  toResendOtpDto,
  toCompleteSignupDto,
  toCheckEmailDto
} from "./dtos";
// others
import { EmailType } from "@/types/services/email";
import { ERROR_CODES } from "@/constants/error-code";
import { Logger } from "@/libs/logger";
import { hashValue } from "@/utils/crypto/bcrypt";
import { OTP_CONFIG, SESSION_CONFIG } from "./constants";
import { SECONDS_PER_MINUTE, MINUTES_PER_HOUR } from "@/constants/time";

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
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly otpSignupRepo: OtpSignupRepository,
    private readonly sessionSignupRepo: SessionSignupRepository,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly emailAvailableGuard: EmailAvailableGuard,
    private readonly cooldownGuard: CooldownGuard
  ) {}

  async sendOtp(body: SendOtpBody, req: Request): Promise<SendOtpDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("SendOtp initiated", { email });

    await this.cooldownGuard.assert(email, t);
    await this.emailAvailableGuard.assert(email, t);

    const otp = await this.otpSignupRepo.createAndStoreOtp(
      email,
      OTP_EXPIRY_SECONDS
    );

    await this.otpSignupRepo.setCooldown(email, OTP_COOLDOWN_SECONDS);

    this.emailDispatcher.send(EmailType.SIGNUP_OTP, {
      email,
      data: { otp, expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES },
      locale: language as I18n.Locale
    });

    Logger.info("SendOtp completed", {
      email,
      expiresIn: OTP_EXPIRY_SECONDS,
      cooldownSeconds: OTP_COOLDOWN_SECONDS
    });

    return toSendOtpDto(OTP_EXPIRY_SECONDS, OTP_COOLDOWN_SECONDS);
  }

  async verifyOtp(body: VerifyOtpBody, req: Request): Promise<VerifyOtpDto> {
    const { email, otp } = body;
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
      throw new BadRequestError(
        t("signup:errors.otpAttemptsExceeded"),
        ERROR_CODES.SIGNUP_OTP_LOCKED
      );
    }

    await this.verifyOtpOrFail(email, otp, t);

    const sessionToken = await this.sessionSignupRepo.createAndStore(
      email,
      SESSION_EXPIRY_SECONDS
    );

    await this.otpSignupRepo.cleanupOtpData(email);

    Logger.info("VerifyOtp completed successfully", {
      email,
      sessionExpiresIn: SESSION_EXPIRY_SECONDS
    });

    return toVerifyOtpDto(sessionToken, SESSION_EXPIRY_SECONDS);
  }

  async resendOtp(body: ResendOtpBody, req: Request): Promise<ResendOtpDto> {
    const { email } = body;
    const { language, t } = req;

    Logger.info("ResendOtp initiated", { email });

    await this.cooldownGuard.assert(email, t);

    const exceeded = await this.otpSignupRepo.hasExceededResendLimit(
      email,
      MAX_RESEND_COUNT
    );
    if (exceeded) {
      Logger.warn("Resend OTP limit exceeded", {
        email,
        maxResends: MAX_RESEND_COUNT
      });
      throw new BadRequestError(
        t("signup:errors.resendLimitExceeded"),
        ERROR_CODES.SIGNUP_RESEND_LIMIT
      );
    }

    await this.emailAvailableGuard.assert(email, t);

    const otp = await this.otpSignupRepo.createAndStoreOtp(
      email,
      OTP_EXPIRY_SECONDS
    );

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

    this.emailDispatcher.send(EmailType.SIGNUP_OTP, {
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

    return toResendOtpDto(
      OTP_EXPIRY_SECONDS,
      OTP_COOLDOWN_SECONDS,
      currentResendCount,
      MAX_RESEND_COUNT
    );
  }

  async completeSignup(
    body: CompleteSignupBody,
    req: Request
  ): Promise<CompleteSignupDto> {
    const { email, password, fullName, gender, dateOfBirth, sessionToken } =
      body;
    const { t } = req;

    Logger.info("CompleteSignup initiated", { email });

    const isValid = await this.sessionSignupRepo.verify(email, sessionToken);
    if (!isValid) {
      Logger.warn("Invalid or expired signup session", { email });
      throw new BadRequestError(
        t("signup:errors.invalidSession"),
        ERROR_CODES.SIGNUP_SESSION_INVALID
      );
    }

    await this.emailAvailableGuard.assert(email, t);

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
      roles: AUTHENTICATION_ROLES.USER,
      fullName: account.fullName,
      avatar: null
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

    return toCompleteSignupDto(account, tokens);
  }

  async checkEmail(params: CheckEmailParams): Promise<CheckEmailDto> {
    const { email } = params;

    Logger.info("CheckEmail initiated", { email });

    const exists = await this.userService.emailExists(email);

    Logger.info("CheckEmail completed", { email });

    return toCheckEmailDto(!exists);
  }

  private async verifyOtpOrFail(
    email: string,
    otp: string,
    t: TranslateFunction
  ): Promise<void> {
    const isValid = await this.otpSignupRepo.verify(email, otp);
    if (isValid) return;

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
        t("signup:errors.invalidOtpWithRemaining", { remaining }),
        ERROR_CODES.SIGNUP_OTP_INVALID
      );
    }

    throw new BadRequestError(
      t("signup:errors.otpAttemptsExceeded"),
      ERROR_CODES.SIGNUP_OTP_LOCKED
    );
  }

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
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const hashedPassword = hashValue(password);
        const auth = await this.authService.create({ hashedPassword }, session);
        Logger.debug("Auth record created", {
          email,
          authId: auth._id.toString()
        });

        const user = await this.userService.createProfile(
          {
            authId: auth._id,
            email,
            fullName,
            gender,
            dateOfBirth: new Date(dateOfBirth)
          },
          session
        );
        Logger.info("User profile created", {
          userId: user._id.toString(),
          authId: auth._id.toString()
        });

        return { authId: auth._id, userId: user._id, email, fullName };
      });

      if (!result) {
        throw new InternalServerError("Signup transaction was aborted");
      }

      return result;
    } finally {
      await session.endSession();
    }
  }
}
