import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { LoginMethod } from "@/modules/login/types";
import type { LoginFailReason } from "@/modules/login-history/types";
import type { LoginResponse } from "@/modules/login/types";
import { generateAuthTokensResponse } from "@/services/implements/AuthToken";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { updateLastLogin as updateLastLoginRepo } from "@/modules/login/repository";
import { LOGIN_STATUSES } from "../constants";
import { logLoginAttempt } from "@/modules/login-history/service";

export const updateLastLogin = (userId: string): void => {
  withRetry(() => updateLastLoginRepo(userId), {
    operationName: "updateLastLogin",
    context: { userId }
  });
};

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
  updateLastLogin(auth._id.toString());

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
