// libs
import type { TFunction } from "i18next";
import i18next from "@/i18n";
// models
import AuthModel from "@/modules/auth/model";
// helpers
import { isValidPassword } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";
// errors
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";
// constants
import { TOKEN_EXPIRY } from "@/core/configs/jwt";
// types
import type { LoginRequest, LoginResponse } from "@/shared/types/modules/login";
// utils
import {
  checkLoginLockout,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  getFailedLoginAttempts
} from "@/modules/login/utils/store";

/*
 * Services for login
 */

export const login = async (
  req: LoginRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, password } = req.body;
  const { t, language } = req;

  await checkAccountLockout(email, t, language);

  const auth = await AuthModel.findOne({ email });

  if (!auth) {
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  const passwordValid = isValidPassword(password, auth.password);

  if (!passwordValid) {
    // Increment failed attempts and apply progressive lockout
    await handleFailedLogin(email, t, language);
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  // Reset failed attempts on successful login
  await resetFailedLoginAttempts(email);

  const tokenPayload = {
    userId: auth._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles
  };

  const { accessToken, refreshToken, idToken } =
    generatePairToken(tokenPayload);

  await AuthModel.findByIdAndUpdate(auth._id, {
    refreshToken,
    lastLogin: new Date()
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: {
      accessToken,
      refreshToken,
      idToken,
      expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
    }
  };
};

/*
 * Helpers --------------------------------------------------------------------------------------------------------------
 */

const checkAccountLockout = async (
  email: string,
  t: TFunction,
  language: string
): Promise<void> => {
  const { isLocked, remainingSeconds } = await checkLoginLockout(email);

  if (isLocked) {
    const attemptCount = await getFailedLoginAttempts(email);

    // Convert seconds to human-readable format
    let timeMessage = "";
    if (remainingSeconds >= 60) {
      const minutes = Math.ceil(remainingSeconds / 60);
      timeMessage =
        language === "vi"
          ? `${minutes} phút`
          : `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      timeMessage =
        language === "vi"
          ? `${remainingSeconds} giây`
          : `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
    }

    const errorMessage = i18next.t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage,
      lng: language
    });
    throw new BadRequestError(errorMessage);
  }
};

const handleFailedLogin = async (
  email: string,
  t: TFunction,
  language: string
): Promise<void> => {
  const { attemptCount, lockoutSeconds } =
    await incrementFailedLoginAttempts(email);

  // Log the failed attempt for monitoring
  if (attemptCount >= 5) {
    const lockoutMinutes = Math.ceil(lockoutSeconds / 60);
    const timeMessage =
      language === "vi"
        ? `${lockoutMinutes} phút`
        : `${lockoutMinutes} minute${lockoutMinutes > 1 ? "s" : ""}`;

    const errorMessage = i18next.t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage,
      lng: language
    });
    throw new BadRequestError(errorMessage);
  }
};
