import type {
  PasswordLoginRequest,
  LoginResponse,
  LoginMethod,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkSendResponse,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { Request } from "express";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { generateAuthTokensResponse } from "@/utils/token";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { formatDuration } from "@/utils/date";
import {
  BadRequestError,
  UnauthorizedError
} from "@/configurations/responses/error";
import type authenticationRepository from "@/repositories/authentication";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import {
  failedAttemptsStore,
  otpStore,
  magicLinkStore
} from "@/modules/login/store";
import { sendLoginOtpEmail, sendMagicLinkEmail } from "./internals/emails";
import {
  createAndStoreOtp,
  setOtpRateLimits,
  createAndStoreToken,
  setMagicLinkCooldown,
  OTP_EXPIRY_SECONDS,
  OTP_COOLDOWN_SECONDS,
  MAGIC_LINK_EXPIRY_SECONDS,
  MAGIC_LINK_COOLDOWN_SECONDS
} from "./internals/helpers";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/constants/enums";
import { LOGIN_OTP_CONFIG } from "@/constants/config";

export class LoginService {
  constructor(
    private readonly authRepo: typeof authenticationRepository,
    private readonly loginHistoryService: LoginHistoryService
  ) {}

  async passwordLogin(
    req: PasswordLoginRequest
  ): Promise<Partial<ResponsePattern<LoginResponse>>> {
    const { email, password } = req.body;
    const { language, t } = req;

    Logger.info("Password login initiated", { email });

    await this.ensureLoginNotLocked(email, t, language);

    const auth = await this.authRepo.findByEmail(email);

    this.ensureAccountExists(auth, email, req, t);
    this.ensureAccountActiveWithLogging(auth, email, req, t);
    this.ensureEmailVerifiedWithLogging(auth, email, req, t);

    await this.verifyPasswordOrFail(auth, password, email, language, req, t);

    withRetry(() => failedAttemptsStore.resetAll(email), {
      operationName: "resetFailedLoginAttempts",
      context: { email }
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: this.completeSuccessfulLogin({
        email,
        auth,
        loginMethod: LOGIN_METHODS.PASSWORD,
        req
      })
    };
  }

  async sendOtp(
    req: OtpSendRequest
  ): Promise<Partial<ResponsePattern<OtpSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Login OTP send initiated", { email });

    await this.ensureCooldownExpired(
      otpStore,
      email,
      t,
      "Login OTP cooldown not expired",
      "login:errors.otpCooldown"
    );
    await this.validateAuthenticationForLogin(email, t);

    const exceeded = await otpStore.hasExceededResendLimit(email);
    if (exceeded) {
      Logger.warn("Login OTP resend limit exceeded", { email });
      throw new BadRequestError(t("login:errors.otpResendLimitExceeded"));
    }

    const otp = await createAndStoreOtp(email);

    withRetry(() => setOtpRateLimits(email), {
      operationName: "setOtpRateLimits",
      context: { email }
    });

    sendLoginOtpEmail(email, otp, language as I18n.Locale);

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
  }

  async verifyOtp(
    req: OtpVerifyRequest
  ): Promise<Partial<ResponsePattern<LoginResponse>>> {
    const { email, otp } = req.body;
    const { t } = req;

    Logger.info("Login OTP verification initiated", { email });

    await this.ensureOtpNotLocked(email, t);

    const auth = await this.ensureAuthenticationExists(email, t);

    const isValid = await otpStore.verify(email, otp);

    if (!isValid) await this.handleInvalidOtp(email, auth, t, req);

    withRetry(() => otpStore.cleanupAll(email), {
      operationName: "cleanupLoginOtpData",
      context: { email }
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: this.completeSuccessfulLogin({
        email,
        auth,
        loginMethod: LOGIN_METHODS.OTP,
        req
      })
    };
  }

  async sendMagicLink(
    req: MagicLinkSendRequest
  ): Promise<Partial<ResponsePattern<MagicLinkSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Magic link send initiated", { email });

    await this.ensureCooldownExpired(
      magicLinkStore,
      email,
      t,
      "Magic link cooldown not expired",
      "login:errors.magicLinkCooldown"
    );
    await this.validateAuthenticationForLogin(email, t);

    const token = await createAndStoreToken(email);

    withRetry(() => setMagicLinkCooldown(email), {
      operationName: "setMagicLinkCooldown",
      context: { email }
    });

    sendMagicLinkEmail(email, token, language as I18n.Locale);

    Logger.info("Magic link send completed", {
      email,
      expiresIn: MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: MAGIC_LINK_COOLDOWN_SECONDS
    });

    return {
      message: t("login:success.magicLinkSent"),
      data: {
        success: true,
        expiresIn: MAGIC_LINK_EXPIRY_SECONDS,
        cooldown: MAGIC_LINK_COOLDOWN_SECONDS
      }
    };
  }

  async verifyMagicLink(
    req: MagicLinkVerifyRequest
  ): Promise<Partial<ResponsePattern<LoginResponse>>> {
    const { email, token } = req.body;
    const { t } = req;

    Logger.info("Magic link verification initiated", { email });

    const auth = await this.ensureAuthenticationExists(email, t);

    const isValid = await magicLinkStore.verifyToken(email, token);

    if (!isValid) this.handleInvalidMagicLink(email, auth, req, t);

    withRetry(() => magicLinkStore.cleanupAll(email), {
      operationName: "cleanupMagicLinkData",
      context: { email }
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: this.completeSuccessfulLogin({
        email,
        auth,
        loginMethod: LOGIN_METHODS.MAGIC_LINK,
        req
      })
    };
  }

  // ──────────────────────────────────────────────
  // Login history helpers
  // ──────────────────────────────────────────────

  private completeSuccessfulLogin({
    email,
    auth,
    loginMethod,
    req
  }: {
    email: string;
    auth: AuthenticationDocument;
    loginMethod: LoginMethod;
    req: Request;
  }): LoginResponse {
    this.loginHistoryService.recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod,
      req
    });

    Logger.info("Login successful", {
      email,
      userId: auth._id.toString(),
      method: loginMethod
    });

    return generateAuthTokensResponse({
      userId: auth._id.toString(),
      authId: auth._id.toString(),
      email: auth.email,
      roles: auth.roles
    });
  }

  // ──────────────────────────────────────────────
  // Shared validators
  // ──────────────────────────────────────────────

  private async ensureCooldownExpired<
    T extends {
      checkCooldown: (email: string) => Promise<boolean>;
      getCooldownRemaining: (email: string) => Promise<number>;
    }
  >(
    store: T,
    email: string,
    t: TranslateFunction,
    logMessage: string,
    errorKey: "login:errors.otpCooldown" | "login:errors.magicLinkCooldown"
  ): Promise<void> {
    const canSend = await store.checkCooldown(email);

    if (!canSend) {
      const remaining = await store.getCooldownRemaining(email);
      Logger.warn(logMessage, { email, remaining });
      throw new BadRequestError(t(errorKey, { seconds: remaining }));
    }
  }

  private async ensureAuthenticationExists(
    email: string,
    t: TranslateFunction
  ): Promise<AuthenticationDocument> {
    const auth = await this.authRepo.findByEmail(email);

    if (!auth) {
      Logger.warn("Authentication not found", { email });
      throw new UnauthorizedError(t("login:errors.invalidEmail"));
    }

    return auth;
  }

  private async validateAuthenticationForLogin(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const auth = await this.ensureAuthenticationExists(email, t);

    if (!auth.isActive) {
      Logger.warn("Account inactive", { email });
      throw new UnauthorizedError(t("login:errors.accountInactive"));
    }

    if (!auth.verifiedEmail) {
      Logger.warn("Email not verified", { email });
      throw new UnauthorizedError(t("login:errors.emailNotVerified"));
    }
  }

  // ──────────────────────────────────────────────
  // Password login validators & helpers
  // ──────────────────────────────────────────────

  private async ensureLoginNotLocked(
    email: string,
    t: PasswordLoginRequest["t"],
    language: string
  ): Promise<void> {
    const { isLocked, remainingSeconds } =
      await failedAttemptsStore.checkLockout(email);

    if (!isLocked) return;

    const attemptCount = await failedAttemptsStore.getCount(email);
    const timeMessage = formatDuration(remainingSeconds, language);

    Logger.warn("Login blocked - account locked", {
      email,
      attemptCount,
      remainingSeconds
    });

    throw new BadRequestError(
      t("login:errors.accountLocked", {
        attempts: attemptCount,
        time: timeMessage
      })
    );
  }

  private ensureAccountExists(
    auth: AuthenticationDocument | null,
    email: string,
    req: PasswordLoginRequest,
    t: PasswordLoginRequest["t"]
  ): asserts auth is AuthenticationDocument {
    if (auth) return;

    this.loginHistoryService.recordFailedLogin({
      userId: null,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
      req
    });

    Logger.warn("Login failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  private ensureAccountActiveWithLogging(
    auth: AuthenticationDocument,
    email: string,
    req: PasswordLoginRequest,
    t: PasswordLoginRequest["t"]
  ): void {
    if (auth.isActive) return;

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.ACCOUNT_INACTIVE,
      req
    });

    Logger.warn("Account inactive", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }

  private ensureEmailVerifiedWithLogging(
    auth: AuthenticationDocument,
    email: string,
    req: PasswordLoginRequest,
    t: PasswordLoginRequest["t"]
  ): void {
    if (auth.verifiedEmail) return;

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.EMAIL_NOT_VERIFIED,
      req
    });

    Logger.warn("Email not verified", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }

  private async verifyPasswordOrFail(
    auth: AuthenticationDocument,
    password: string,
    email: string,
    language: string,
    req: PasswordLoginRequest,
    t: PasswordLoginRequest["t"]
  ): Promise<void> {
    const passwordValid = isValidHashedValue(password, auth.password);

    if (passwordValid) return;

    const { attemptCount, lockoutSeconds } =
      await this.trackFailedPasswordAttempt(email, auth, req);

    if (attemptCount >= 5 && lockoutSeconds > 0) {
      const timeMessage = formatDuration(lockoutSeconds, language);
      throw new BadRequestError(
        t("login:errors.accountLocked", {
          attempts: attemptCount,
          time: timeMessage
        })
      );
    }

    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  private async trackFailedPasswordAttempt(
    email: string,
    auth: AuthenticationDocument,
    req: PasswordLoginRequest
  ): Promise<{ attemptCount: number; lockoutSeconds: number }> {
    const { attemptCount, lockoutSeconds } =
      await failedAttemptsStore.trackAttempt(email);

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
      req
    });

    Logger.warn("Login failed - invalid password", { email, attemptCount });
    return { attemptCount, lockoutSeconds };
  }

  // ──────────────────────────────────────────────
  // OTP validators & helpers
  // ──────────────────────────────────────────────

  private async ensureOtpNotLocked(
    email: string,
    t: TranslateFunction
  ): Promise<void> {
    const isLocked = await otpStore.isLocked(email);

    if (!isLocked) return;

    const attempts = await otpStore.getFailedAttemptCount(email);
    Logger.warn("Login OTP verification locked", { email, attempts });

    throw new BadRequestError(
      t("login:errors.otpLocked", {
        minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
      })
    );
  }

  private async handleInvalidOtp(
    email: string,
    auth: AuthenticationDocument,
    t: TranslateFunction,
    req: OtpVerifyRequest
  ): Promise<never> {
    const attempts = await this.trackFailedOtpAttempt(email, auth, req);
    const remaining = LOGIN_OTP_CONFIG.MAX_FAILED_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new BadRequestError(
        t("login:errors.otpLocked", {
          minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
        })
      );
    }

    throw new UnauthorizedError(
      t("login:errors.invalidOtpWithRemaining", { remaining })
    );
  }

  private async trackFailedOtpAttempt(
    email: string,
    auth: AuthenticationDocument,
    req: OtpVerifyRequest
  ): Promise<number> {
    const attempts = await otpStore.incrementFailedAttempts(email);

    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.OTP,
      failReason: LOGIN_FAIL_REASONS.INVALID_OTP,
      req
    });

    Logger.warn("Login OTP verification failed", { email, attempts });
    return attempts;
  }

  // ──────────────────────────────────────────────
  // Magic link helpers
  // ──────────────────────────────────────────────

  private handleInvalidMagicLink(
    email: string,
    auth: AuthenticationDocument,
    req: MagicLinkVerifyRequest,
    t: TranslateFunction
  ): never {
    this.loginHistoryService.recordFailedLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.MAGIC_LINK,
      failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
      req
    });

    Logger.warn("Magic link verification failed - invalid token", { email });
    throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
  }
}
