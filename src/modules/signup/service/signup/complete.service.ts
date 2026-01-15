/**
 * Complete Signup Service
 * Use Case: User completes registration with profile data
 *
 * Business Flow:
 * 1. Verify session token is valid
 * 2. Ensure email is still not registered (double-check)
 * 3. Create auth record with hashed password
 * 4. Create user profile
 * 5. Issue authentication tokens
 * 6. Store refresh token
 * 7. Cleanup signup session data
 *
 * Idempotency: Session token is single-use (deleted after completion)
 */

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
  createAuthRecord,
  createUserProfile,
  storeRefreshToken
} from "@/modules/signup/repository";

import {
  verifySession,
  cleanupSignupSession
} from "@/modules/signup/utils/store";

import { hashPassword } from "@/app/utils/crypto/bcrypt";
import { JsonWebTokenService } from "@/app/services/implements/JsonWebTokenService";

import { TOKEN_EXPIRY } from "@/infra/configs/jwt";
import { AUTH_ROLES } from "@/modules/auth/constants";
const ensureSessionValid = async (
  email: string,
  sessionToken: string,
  t: TFunction
): Promise<void> => {
  const isValid = await verifySession(email, sessionToken);

  if (!isValid) {
    Logger.warn("Invalid or expired signup session", { email });
    throw new BadRequestError(t("signup:errors.invalidSession"));
  }
};

const ensureEmailNotRegistered = async (
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
interface CreateAccountResult {
  authId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  email: string;
  fullName: string;
}

const createUserAccount = async (
  email: string,
  password: string,
  fullName: string,
  gender: Gender,
  dateOfBirth: string
): Promise<CreateAccountResult> => {
  const hashedPassword = hashPassword(password);

  const auth = await createAuthRecord({
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
export const completeSignup = async (
  req: CompleteSignupRequest
): Promise<Partial<ResponsePattern<CompleteSignupResponse>>> => {
  const { email, password, fullName, gender, dateOfBirth, sessionToken } =
    req.body;
  const { t } = req;

  Logger.info("CompleteSignup initiated", { email });

  await ensureSessionValid(email, sessionToken, t);

  await ensureEmailNotRegistered(email, t);

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
    AUTH_ROLES.USER
  );

  await persistRefreshToken(account.authId, tokens.refreshToken);

  await cleanupSignupSession(email);

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
