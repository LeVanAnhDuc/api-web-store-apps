import type { TFunction } from "i18next";
import type {
  CompleteSignupResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  CompleteSignupRequest
} from "@/shared/types/modules/signup";
import AuthModel from "@/modules/auth/model";
import UserModel from "@/modules/user/model";
import { generateOtp, generateSessionId } from "@/modules/signup/utils/otp";
import { Logger } from "@/core/utils/logger";
import i18next from "@/i18n";
import {
  checkOtpCoolDown,
  setOtpCoolDown,
  createAndStoreOtp,
  verifyOtp as verifyOtpFromStore,
  deleteOtp,
  storeSession,
  verifySession,
  isOtpAccountLocked,
  incrementFailedOtpAttempts,
  cleanupOtpData,
  cleanupSignupSession
} from "@/modules/signup/utils/store";
import { sendTemplatedEmail } from "@/shared/services/email/email.service";
import { BadRequestError, ConflictRequestError } from "@/core/responses/error";
import { OTP_CONFIG } from "@/shared/constants/modules/signup";
import { hashPassword } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";
import { AUTH_ROLES } from "@/shared/constants/modules/auth";
import { TOKEN_EXPIRY } from "@/core/configs/jwt";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

/*
 * Services for signup
 * Note: Rate limiting (IP + Email) is handled by middleware in routes
 */

export const sendOtp = async (
  req: SendOtpRequest
): Promise<Partial<ResponsePattern<SendOtpResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  await checkAndSetOtpCoolDown(email, t);
  await checkEmailAvailability(email, t);

  const otp = generateOtp();

  await checkAndCreateOtp(
    email,
    otp,
    OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE
  );

  sendOtpEmail(email, otp, language as I18n.Locale)
    .then(() => Logger.info(`OTP sent successfully to ${email}`))
    .catch((error) =>
      Logger.error(`Background email sending failed for ${email}`, error)
    );

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  return {
    message: t("signup:success.otpSent"),
    data: {
      success: true,
      expiresIn: expiresInSeconds,
      cooldownSeconds: OTP_CONFIG.RESEND_COOLDOWN_SECONDS
    }
  };
};

export const verifyOtpService = async (
  req: VerifyOtpRequest
): Promise<Partial<ResponsePattern<VerifyOtpResponse>>> => {
  const { email, otp } = req.body;
  const { t, language } = req;

  await checkMatchOtp(email, otp, t, language);

  const expiresInSeconds = OTP_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
  const sessionToken = generateSessionId();

  await storeSession(email, sessionToken, expiresInSeconds);

  return {
    message: t("signup:success.otpVerified"),
    data: {
      success: true,
      sessionToken,
      expiresIn: expiresInSeconds
    }
  };
};

export const completeSignup = async (
  req: CompleteSignupRequest
): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> => {
  const { email, password, fullName, gender, dateOfBirth, sessionToken } =
    req.body;
  const { t } = req;

  await checkSessionValidity(email, sessionToken, t);
  await checkEmailAvailability(email, t);

  const hashedPassword = hashPassword(password);

  const auth = await AuthModel.create({
    email,
    password: hashedPassword,
    verifiedEmail: true,
    roles: AUTH_ROLES.USER
  });

  const user = await UserModel.create({
    authId: auth._id,
    fullName,
    gender,
    dateOfBirth: new Date(dateOfBirth)
  });

  const { accessToken, refreshToken } = generatePairToken({
    userId: user._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles
  });

  await AuthModel.findByIdAndUpdate(auth._id, { refreshToken });

  await cleanupSignupSession(email);

  return {
    message: t("signup:success.signupCompleted"),
    data: {
      success: true,
      user: {
        id: user._id.toString(),
        email: auth.email,
        fullName: user.fullName
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
      }
    }
  };
};

/*
 * Helpers --------------------------------------------------------------------------------------------------------------
 */

const sendOtpEmail = async (
  email: string,
  otp: string,
  locale: I18n.Locale
): Promise<void> => {
  const t = i18next.getFixedT(locale);
  const subject = t("email:subjects.otpVerification");

  await sendTemplatedEmail(
    email,
    subject,
    "otp-verification",
    {
      otp,
      expiryMinutes: OTP_CONFIG.EXPIRY_MINUTES
    },
    locale
  );
};

const checkAndSetOtpCoolDown = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const canSend = await checkOtpCoolDown(email);

  if (!canSend) {
    throw new BadRequestError(t("signup:errors.resendCoolDown"));
  }

  await setOtpCoolDown(email, OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
};

const checkEmailAvailability = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const existingUser = await AuthModel.findOne({ email });

  if (existingUser) {
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

const checkSessionValidity = async (
  email: string,
  sessionId: string,
  t: TFunction
): Promise<void> => {
  const isValid = await verifySession(email, sessionId);

  if (!isValid) {
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};

const checkAndCreateOtp = async (
  email: string,
  otp: string,
  expireTime: number
): Promise<void> => {
  await deleteOtp(email);
  await createAndStoreOtp(email, otp, expireTime);
};

const checkMatchOtp = async (
  email: string,
  otp: string,
  t: TFunction,
  language: string
): Promise<void> => {
  const isLocked = await isOtpAccountLocked(
    email,
    OTP_CONFIG.MAX_FAILED_ATTEMPTS
  );

  if (isLocked) {
    throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
  }

  const isOtpValid = await verifyOtpFromStore(email, otp);

  if (!isOtpValid) {
    const failedCount = await incrementFailedOtpAttempts(
      email,
      OTP_CONFIG.LOCKOUT_DURATION_MINUTES
    );
    const remainingAttempts = OTP_CONFIG.MAX_FAILED_ATTEMPTS - failedCount;

    if (remainingAttempts > 0) {
      const errorMessage = i18next.t("signup:errors.invalidOtpWithRemaining", {
        remaining: remainingAttempts,
        lng: language
      });
      throw new BadRequestError(errorMessage);
    } else {
      throw new BadRequestError(t("signup:errors.otpAttemptsExceeded"));
    }
  }

  await cleanupOtpData(email);
};
