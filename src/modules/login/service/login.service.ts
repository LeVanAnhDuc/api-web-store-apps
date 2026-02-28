import type {
  PasswordLoginRequest,
  LoginResponse,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  MagicLinkSendRequest,
  MagicLinkSendResponse,
  MagicLinkVerifyRequest
} from "@/types/modules/login";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { generateAuthTokensResponse } from "@/utils/token";
import { getAuthenticationRepository } from "@/repositories/authentication";
import type AuthenticationRepository from "@/repositories/authentication";
import {
  failedAttemptsStore,
  otpStore,
  magicLinkStore
} from "@/modules/login/store";
import {
  ensureLoginNotLocked,
  ensureAccountExists,
  ensureAccountActiveWithLogging,
  ensureEmailVerifiedWithLogging,
  ensureCooldownExpired,
  ensureAuthenticationExists,
  validateAuthenticationForLogin,
  ensureOtpNotLocked,
  ensureCanResend
} from "./validators";
import { recordSuccessfulLogin, completeSuccessfulLogin } from "./helpers";
import { sendLoginOtpEmail, sendMagicLinkEmail } from "./emails";
import {
  verifyPasswordOrFail,
  createAndStoreOtp,
  setOtpRateLimits,
  handleInvalidOtp,
  createAndStoreToken,
  setMagicLinkCooldown,
  handleInvalidMagicLink,
  OTP_EXPIRY_SECONDS,
  OTP_COOLDOWN_SECONDS,
  MAGIC_LINK_EXPIRY_SECONDS,
  MAGIC_LINK_COOLDOWN_SECONDS
} from "./helpers";
import { LOGIN_METHODS } from "@/constants/enums";

class LoginService {
  constructor(private readonly authRepo: AuthenticationRepository) {}

  async passwordLogin(
    req: PasswordLoginRequest
  ): Promise<Partial<ResponsePattern<LoginResponse>>> {
    const { email, password } = req.body;
    const { language, t } = req;

    Logger.info("Password login initiated", { email });

    await ensureLoginNotLocked(email, t, language);

    const auth = await this.authRepo.findByEmail(email);

    ensureAccountExists(auth, email, req, t);
    ensureAccountActiveWithLogging(auth, email, req, t);
    ensureEmailVerifiedWithLogging(auth, email, req, t);

    await verifyPasswordOrFail(auth, password, email, language, req, t);

    withRetry(() => failedAttemptsStore.resetAll(email), {
      operationName: "resetFailedLoginAttempts",
      context: { email }
    });

    recordSuccessfulLogin({
      userId: auth._id,
      usernameAttempted: email,
      loginMethod: LOGIN_METHODS.PASSWORD,
      req
    });

    Logger.info("Password login successful", {
      email,
      userId: auth._id.toString()
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: generateAuthTokensResponse({
        userId: auth._id.toString(),
        authId: auth._id.toString(),
        email: auth.email,
        roles: auth.roles
      })
    };
  }

  async sendOtp(
    req: OtpSendRequest
  ): Promise<Partial<ResponsePattern<OtpSendResponse>>> {
    const { email } = req.body;
    const { language, t } = req;

    Logger.info("Login OTP send initiated", { email });

    await ensureCooldownExpired(
      otpStore,
      email,
      t,
      "Login OTP cooldown not expired",
      "login:errors.otpCooldown"
    );
    await validateAuthenticationForLogin(email, t);
    await ensureCanResend(email, t);

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

    await ensureOtpNotLocked(email, t);

    const auth = await ensureAuthenticationExists(email, t);

    const isValid = await otpStore.verify(email, otp);

    if (!isValid) await handleInvalidOtp(email, auth, t, req);

    withRetry(() => otpStore.cleanupAll(email), {
      operationName: "cleanupLoginOtpData",
      context: { email }
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: completeSuccessfulLogin({
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

    await ensureCooldownExpired(
      magicLinkStore,
      email,
      t,
      "Magic link cooldown not expired",
      "login:errors.magicLinkCooldown"
    );
    await validateAuthenticationForLogin(email, t);

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

    const auth = await ensureAuthenticationExists(email, t);

    const isValid = await magicLinkStore.verifyToken(email, token);

    if (!isValid) handleInvalidMagicLink(email, auth, req, t);

    withRetry(() => magicLinkStore.cleanupAll(email), {
      operationName: "cleanupMagicLinkData",
      context: { email }
    });

    return {
      message: t("login:success.loginSuccessful"),
      data: completeSuccessfulLogin({
        email,
        auth,
        loginMethod: LOGIN_METHODS.MAGIC_LINK,
        req
      })
    };
  }
}

export const loginService = new LoginService(getAuthenticationRepository());
