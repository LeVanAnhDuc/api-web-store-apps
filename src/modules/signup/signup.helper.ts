// types
import type { Gender } from "@/types/modules/user";
import type { Schema } from "mongoose";
import type { AuthenticationService } from "@/modules/authentication/authentication.service";
import type { UserService } from "@/modules/user/user.service";
import type { OtpSignupRepository } from "./repositories/otp-signup.repository";
import type { SessionSignupRepository } from "./repositories/session-signup.repository";
// config
import {
  BadRequestError,
  ConflictRequestError
} from "@/config/responses/error";
// others
import { Logger } from "@/utils/logger";
import { hashValue } from "@/utils/crypto/bcrypt";
import { OTP_CONFIG } from "@/constants/config";

const MAX_FAILED_ATTEMPTS = OTP_CONFIG.MAX_FAILED_ATTEMPTS;
const LOCKOUT_DURATION_MINUTES = OTP_CONFIG.LOCKOUT_DURATION_MINUTES;

// ──────────────────────────────────────────────
// Validators
// ──────────────────────────────────────────────

export async function ensureEmailAvailable(
  authService: AuthenticationService,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const exists = await authService.emailExists(email);

  if (exists) {
    Logger.warn("Email already exists", { email });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
}

export async function ensureCooldownExpired(
  otpSignupRepo: OtpSignupRepository,
  email: string,
  t: TranslateFunction
): Promise<void> {
  const canSend = await otpSignupRepo.checkCooldown(email);

  if (!canSend) {
    const remaining = await otpSignupRepo.getCooldownRemaining(email);
    Logger.warn("OTP cooldown not expired", { email, remaining });
    throw new BadRequestError(
      t("signup:errors.resendCoolDown", { seconds: remaining })
    );
  }
}

// ──────────────────────────────────────────────
// OTP helpers
// ──────────────────────────────────────────────

export async function createAndStoreOtp(
  otpSignupRepo: OtpSignupRepository,
  email: string,
  expirySeconds: number
): Promise<string> {
  const otp = otpSignupRepo.createOtp();

  await otpSignupRepo.clearOtp(email);
  await otpSignupRepo.storeHashed(email, otp, expirySeconds);

  Logger.debug("OTP created and stored", {
    email,
    expiresInSeconds: expirySeconds
  });

  return otp;
}

export async function verifyOtpOrFail(
  otpSignupRepo: OtpSignupRepository,
  email: string,
  otp: string,
  t: TranslateFunction
): Promise<void> {
  const isValid = await otpSignupRepo.verify(email, otp);

  if (!isValid) {
    const failedCount = await otpSignupRepo.incrementFailedAttempts(
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

// ──────────────────────────────────────────────
// Session helpers
// ──────────────────────────────────────────────

export async function createAndStoreSession(
  sessionSignupRepo: SessionSignupRepository,
  email: string,
  expirySeconds: number
): Promise<string> {
  const sessionToken = sessionSignupRepo.createToken();

  await sessionSignupRepo.store(email, sessionToken, expirySeconds);

  Logger.debug("Signup session created", {
    email,
    expiresInSeconds: expirySeconds
  });

  return sessionToken;
}

// ──────────────────────────────────────────────
// Account creation
// ──────────────────────────────────────────────

export async function createUserAccount(
  authService: AuthenticationService,
  userService: UserService,
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
  const auth = await authService.create({ email, hashedPassword });
  Logger.debug("Auth record created", {
    email,
    authId: auth._id.toString()
  });

  const user = await userService.createProfile({
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
