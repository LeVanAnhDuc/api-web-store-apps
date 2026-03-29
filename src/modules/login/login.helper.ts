// types
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { LoginMethod } from "@/types/modules/login";
import type { Request } from "express";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { LoginHistoryService } from "@/modules/login-history/login-history.service";
import type { OtpLoginRepository } from "./repositories/otp-login.repository";
import type { FailedAttemptsRepository } from "./repositories/failed-attempts.repository";
import type { LoginResponseDto } from "./dtos";
// config
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "@/config/responses/error";
// others
import { Logger } from "@/utils/logger";
import { generateAuthTokensResponse } from "@/utils/token";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { formatDuration } from "@/utils/date";
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS
} from "@/constants/modules/login-history";
import { LOGIN_OTP_CONFIG } from "@/constants/config";
import { toLoginResponseDto } from "./dtos";

// ──────────────────────────────────────────────
// Login completion
// ──────────────────────────────────────────────

export async function completeSuccessfulLogin(
  loginHistoryService: LoginHistoryService,
  userService: UserService,
  {
    email,
    auth,
    loginMethod,
    req
  }: {
    email: string;
    auth: AuthenticationDocument;
    loginMethod: LoginMethod;
    req: Request;
  }
): Promise<LoginResponseDto> {
  loginHistoryService.recordSuccessfulLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod,
    req
  });

  const user = await userService.findByAuthId(auth._id.toString());

  if (!user) {
    throw new NotFoundError("user:errors.notFound");
  }

  Logger.info("Login successful", {
    email,
    userId: user._id.toString(),
    method: loginMethod
  });

  return toLoginResponseDto(
    generateAuthTokensResponse({
      userId: user._id.toString(),
      authId: auth._id.toString(),
      email: auth.email,
      roles: auth.roles,
      fullName: user.fullName,
      avatar: user.avatar ?? null
    })
  );
}

// ──────────────────────────────────────────────
// Shared validators
// ──────────────────────────────────────────────

export async function ensureCooldownExpired<
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

export async function ensureAuthenticationExists(
  authService: AuthenticationService,
  email: string,
  t: TranslateFunction
): Promise<AuthenticationDocument> {
  const auth = await authService.findByEmail(email);

  if (!auth) {
    Logger.warn("Authentication not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidEmail"));
  }

  return auth;
}

export async function validateAuthenticationForLogin(
  authService: AuthenticationService,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const auth = await ensureAuthenticationExists(authService, email, t);

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

export async function ensureLoginNotLocked(
  failedAttemptsRepo: FailedAttemptsRepository,
  email: string,
  t: TranslateFunction,
  language: string
): Promise<void> {
  const { isLocked, remainingSeconds } =
    await failedAttemptsRepo.checkLockout(email);

  if (!isLocked) return;

  const attemptCount = await failedAttemptsRepo.getCount(email);
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

export function ensureAccountExists(
  loginHistoryService: LoginHistoryService,
  auth: AuthenticationDocument | null,
  email: string,
  req: Request,
  t: TranslateFunction
): asserts auth is AuthenticationDocument {
  if (auth) return;

  loginHistoryService.recordFailedLogin({
    userId: null,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.INVALID_CREDENTIALS,
    req
  });

  Logger.warn("Login failed - email not found", { email });
  throw new UnauthorizedError(t("login:errors.invalidCredentials"));
}

export function ensureAccountActiveWithLogging(
  loginHistoryService: LoginHistoryService,
  auth: AuthenticationDocument,
  email: string,
  req: Request,
  t: TranslateFunction
): void {
  if (auth.isActive) return;

  loginHistoryService.recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.ACCOUNT_INACTIVE,
    req
  });

  Logger.warn("Account inactive", { email });
  throw new UnauthorizedError(t("login:errors.accountInactive"));
}

export function ensureEmailVerifiedWithLogging(
  loginHistoryService: LoginHistoryService,
  auth: AuthenticationDocument,
  email: string,
  req: Request,
  t: TranslateFunction
): void {
  if (auth.verifiedEmail) return;

  loginHistoryService.recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.PASSWORD,
    failReason: LOGIN_FAIL_REASONS.EMAIL_NOT_VERIFIED,
    req
  });

  Logger.warn("Email not verified", { email });
  throw new UnauthorizedError(t("login:errors.emailNotVerified"));
}

export async function verifyPasswordOrFail(
  failedAttemptsRepo: FailedAttemptsRepository,
  loginHistoryService: LoginHistoryService,
  auth: AuthenticationDocument,
  password: string,
  email: string,
  language: string,
  req: Request,
  t: TranslateFunction
): Promise<void> {
  const passwordValid = isValidHashedValue(password, auth.password);

  if (passwordValid) return;

  const { attemptCount, lockoutSeconds } = await trackFailedPasswordAttempt(
    failedAttemptsRepo,
    loginHistoryService,
    email,
    auth,
    req
  );

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

async function trackFailedPasswordAttempt(
  failedAttemptsRepo: FailedAttemptsRepository,
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  req: Request
): Promise<{ attemptCount: number; lockoutSeconds: number }> {
  const { attemptCount, lockoutSeconds } =
    await failedAttemptsRepo.trackAttempt(email);

  loginHistoryService.recordFailedLogin({
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

export async function ensureOtpNotLocked(
  otpLoginRepo: OtpLoginRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const isLocked = await otpLoginRepo.isLocked(email);

  if (!isLocked) return;

  const attempts = await otpLoginRepo.getFailedAttemptCount(email);
  Logger.warn("Login OTP verification locked", { email, attempts });

  throw new BadRequestError(
    t("login:errors.otpLocked", {
      minutes: LOGIN_OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    })
  );
}

export async function handleInvalidOtp(
  otpLoginRepo: OtpLoginRepository,
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction,
  req: Request
): Promise<never> {
  const attempts = await trackFailedOtpAttempt(
    otpLoginRepo,
    loginHistoryService,
    email,
    auth,
    req
  );
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

async function trackFailedOtpAttempt(
  otpLoginRepo: OtpLoginRepository,
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  req: Request
): Promise<number> {
  const attempts = await otpLoginRepo.incrementFailedAttempts(email);

  loginHistoryService.recordFailedLogin({
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

export function handleInvalidMagicLink(
  loginHistoryService: LoginHistoryService,
  email: string,
  auth: AuthenticationDocument,
  req: Request,
  t: TranslateFunction
): never {
  loginHistoryService.recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
    req
  });

  Logger.warn("Magic link verification failed - invalid token", { email });
  throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
}
