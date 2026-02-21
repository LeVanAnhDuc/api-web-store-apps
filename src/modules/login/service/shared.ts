import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthenticationDocument } from "@/types/modules/authentication";
import type { LoginMethod } from "@/types/modules/login";
import type { LoginFailReason } from "@/types/modules/login-history";
import type { LoginResponse } from "@/types/modules/login";
import { generateAuthTokensResponse } from "@/utils/token";
import { Logger } from "@/utils/logger";
import { LOGIN_STATUSES } from "@/constants/enums";
import { logLoginAttempt } from "@/modules/login-history/service";

export const recordSuccessfulLogin = ({
  userId,
  usernameAttempted,
  loginMethod,
  req
}: {
  userId: Schema.Types.ObjectId | string;
  usernameAttempted: string;
  loginMethod: LoginMethod;
  req: Request;
}): void => {
  logLoginAttempt({
    userId: userId.toString(),
    usernameAttempted,
    status: LOGIN_STATUSES.SUCCESS,
    loginMethod,
    req
  });
};

export const recordFailedLogin = ({
  userId,
  usernameAttempted,
  loginMethod,
  failReason,
  req
}: {
  userId?: Schema.Types.ObjectId | string | null;
  usernameAttempted: string;
  loginMethod: LoginMethod;
  failReason: LoginFailReason;
  req: Request;
}): void => {
  logLoginAttempt({
    userId: userId ? userId.toString() : null,
    usernameAttempted,
    status: LOGIN_STATUSES.FAILED,
    failReason,
    loginMethod,
    req
  });
};

export const completeSuccessfulLogin = ({
  email,
  auth,
  loginMethod,
  req
}: {
  email: string;
  auth: AuthenticationDocument;
  loginMethod: LoginMethod;
  req: Request;
}): LoginResponse => {
  recordSuccessfulLogin({
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
};
