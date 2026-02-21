import type { Schema } from "mongoose";
import type { Gender } from "@/modules/user/types";
import type {
  CompleteSignupRequest,
  CompleteSignupResponse
} from "@/modules/signup/types";
import { Logger } from "@/utils/logger";
import {
  createAuthenticationRecord,
  createUserProfile
} from "@/modules/signup/repository";
import { otpStore, sessionStore } from "@/modules/signup/store";
import { hashValue } from "@/utils/crypto/bcrypt";
import { generateAuthTokensResponse } from "@/services/implements/AuthToken";
import { ensureEmailAvailable, ensureSessionValid } from "../validators";
import { AUTHENTICATION_ROLES } from "@/modules/authentication/constants";

const createAuthentication = async (
  email: string,
  password: string
): Promise<Schema.Types.ObjectId> => {
  const hashedPassword = hashValue(password);

  const auth = await createAuthenticationRecord({
    email,
    hashedPassword
  });

  Logger.debug("Auth record created", {
    email,
    authId: auth._id.toString()
  });

  return auth._id;
};

const createUser = async (
  authId: Schema.Types.ObjectId,
  fullName: string,
  gender: Gender,
  dateOfBirth: string
): Promise<Schema.Types.ObjectId> => {
  const user = await createUserProfile({
    authId,
    fullName,
    gender,
    dateOfBirth: new Date(dateOfBirth)
  });

  Logger.info("User profile created", {
    userId: user._id.toString(),
    authId: authId.toString()
  });

  return user._id;
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
  const authId = await createAuthentication(email, password);
  const userId = await createUser(authId, fullName, gender, dateOfBirth);

  return {
    authId,
    userId,
    email,
    fullName
  };
};

const cleanupSignupData = async (email: string): Promise<void> => {
  await Promise.all([
    otpStore.cleanupOtpData(email),
    sessionStore.clear(email)
  ]);

  Logger.debug("Signup data cleaned up", { email });
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

  const tokens = generateAuthTokensResponse({
    userId: account.userId.toString(),
    authId: account.authId.toString(),
    email: account.email,
    roles: AUTHENTICATION_ROLES.USER
  });

  await cleanupSignupData(email);

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
      tokens
    }
  };
};
