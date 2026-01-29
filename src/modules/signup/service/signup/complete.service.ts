import type { TFunction } from "i18next";
import type { Schema } from "mongoose";
import type { Gender } from "@/modules/user/types";
import type {
  CompleteSignupRequest,
  CompleteSignupResponse
} from "@/modules/signup/types";
import { BadRequestError, ConflictRequestError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import {
  isEmailRegistered,
  createAuthenticationRecord,
  createUserProfile,
  storeRefreshToken
} from "@/modules/signup/repository";
import { otpStore, sessionStore } from "@/modules/signup/store";
import { hashPassword } from "@/app/utils/crypto/bcrypt";
import { JsonWebTokenService } from "@/app/services/implements/JsonWebTokenService";
import { TOKEN_EXPIRY } from "@/infra/configs/jwt";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";

const ensureSessionValid = async (
  email: string,
  sessionToken: string,
  t: TFunction
): Promise<void> => {
  const isValid = await sessionStore.verify(email, sessionToken);

  if (!isValid) {
    Logger.warn("Invalid or expired signup session", { email });
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};

const ensureEmailAvailable = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const exists = await isEmailRegistered(email);

  if (exists) {
    Logger.warn("Complete signup blocked - email registered during flow", {
      email
    });
    throw new ConflictRequestError(t("signup:errors.emailAlreadyExists"));
  }
};

const createUserAccount = async (
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
}> => {
  const hashedPassword = hashPassword(password);

  const auth = await createAuthenticationRecord({
    email,
    hashedPassword
  });

  Logger.debug("Auth record created", {
    email,
    authId: auth._id.toString()
  });

  const user = await createUserProfile({
    authId: auth._id,
    fullName,
    gender,
    dateOfBirth: new Date(dateOfBirth)
  });

  Logger.info("User account created successfully", {
    email,
    userId: user._id.toString(),
    authId: auth._id.toString()
  });

  return {
    authId: auth._id,
    userId: user._id,
    email: auth.email,
    fullName: user.fullName
  };
};

const issueAuthTokens = (
  userId: Schema.Types.ObjectId,
  authId: Schema.Types.ObjectId,
  email: string,
  roles: string
): {
  accessToken: string;
  refreshToken: string;
  idToken: string;
} =>
  JsonWebTokenService.generateAuthTokens({
    userId: userId.toString(),
    authId: authId.toString(),
    email,
    roles
  });

const persistRefreshToken = async (
  authId: Schema.Types.ObjectId,
  refreshToken: string
): Promise<void> => {
  await storeRefreshToken(authId, refreshToken);
};
export const completeSignupService = async (
  req: CompleteSignupRequest
): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> => {
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

  const tokens = issueAuthTokens(
    account.userId,
    account.authId,
    account.email,
    AUTHENTICATION_ROLES.USER
  );

  await persistRefreshToken(account.authId, tokens.refreshToken);

  await Promise.all([
    otpStore.cleanupOtpData(email),
    sessionStore.clear(email)
  ]);

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
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
      }
    }
  };
};
