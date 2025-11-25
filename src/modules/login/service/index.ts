import i18next from "@/i18n";
import AuthModel from "@/modules/auth/model";
import { isValidPassword } from "@/core/helpers/bcrypt";
import { generatePairToken } from "@/core/helpers/jwt";
import { UnauthorizedError, BadRequestError } from "@/core/responses/error";
import { TOKEN_EXPIRY } from "@/core/configs/jwt";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";
import type { LoginRequest, LoginResponse } from "@/shared/types/modules/login";
import {
  checkLoginLockout,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  getFailedLoginAttempts
} from "@/modules/login/utils/store";

/*
 * Services for login
 * Note: IP-based rate limiting is handled by middleware in routes
 */

export const login = async (
  req: LoginRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, password } = req.body;
  const { t, language } = req;

  await _checkAccountLockout(email, language);

  const auth = await AuthModel.findOne({ email });

  if (!auth) {
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

  const passwordValid = isValidPassword(password, auth.password);

  if (!passwordValid) {
    await _handleFailedLogin(email, language);
    throw new UnauthorizedError(t("login:errors.invalidCredentials"));
  }

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

const _formatTimeMessage = (seconds: number, language: string): string => {
  if (seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
    return language === "vi"
      ? `${minutes} phút`
      : `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return language === "vi"
    ? `${seconds} giây`
    : `${seconds} second${seconds > 1 ? "s" : ""}`;
};

const _checkAccountLockout = async (
  email: string,
  language: string
): Promise<void> => {
  const { isLocked, remainingSeconds } = await checkLoginLockout(email);

  if (isLocked) {
    const attemptCount = await getFailedLoginAttempts(email);
    const timeMessage = _formatTimeMessage(remainingSeconds, language);

    const errorMessage = i18next.t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage,
      lng: language
    });
    throw new BadRequestError(errorMessage);
  }
};

const _handleFailedLogin = async (
  email: string,
  language: string
): Promise<void> => {
  const { attemptCount, lockoutSeconds } =
    await incrementFailedLoginAttempts(email);

  if (attemptCount >= 5 && lockoutSeconds > 0) {
    const timeMessage = _formatTimeMessage(lockoutSeconds, language);

    const errorMessage = i18next.t("login:errors.accountLocked", {
      attempts: attemptCount,
      time: timeMessage,
      lng: language
    });
    throw new BadRequestError(errorMessage);
  }
};
