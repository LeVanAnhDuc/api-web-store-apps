import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { LoginMethod } from "@/modules/login/types";
import type {
  CreateLoginHistoryInput,
  LoginStatus,
  LoginFailReason
} from "@/modules/login-history/types";
import type { LoginResponse } from "@/modules/login/types";
import { JsonWebTokenService } from "@/app/services/implements/JsonWebTokenService";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { createLoginHistory } from "@/modules/login-history/repository";
import { updateLastLogin as updateLastLoginRepo } from "@/modules/login/repository";
import { TOKEN_EXPIRY } from "@/infra/configs/jwt";
import { getClientIp } from "./helpers";

export const generateLoginTokens = (
  authentication: AuthenticationDocument
): LoginResponse => {
  const tokenPayload = {
    userId: authentication._id.toString(),
    authId: authentication._id.toString(),
    email: authentication.email,
    roles: authentication.roles
  };

  const { accessToken, refreshToken, idToken } =
    JsonWebTokenService.generateAuthTokens(tokenPayload);

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresIn: TOKEN_EXPIRY.NUMBER_ACCESS_TOKEN
  };
};

export const updateLastLogin = (userId: string): void => {
  withRetry(() => updateLastLoginRepo(userId), {
    operationName: "updateLastLogin",
    context: { userId }
  });
};

export const recordSuccessfulLogin = ({
  userId,
  loginMethod,
  req
}: {
  userId: Schema.Types.ObjectId | string;
  loginMethod: LoginMethod;
  req: Request;
}): void => {
  const ip = getClientIp(req);

  const historyInput: CreateLoginHistoryInput = {
    userId,
    method: loginMethod,
    status: "success" as LoginStatus,
    ip
  };

  withRetry(() => createLoginHistory(historyInput), {
    operationName: "recordSuccessfulLogin",
    context: { userId: userId.toString(), loginMethod }
  });
};

export const recordFailedLogin = ({
  userId,
  loginMethod,
  failReason,
  req
}: {
  userId?: Schema.Types.ObjectId | string;
  loginMethod: LoginMethod;
  failReason: LoginFailReason;
  req: Request;
}): void => {
  if (!userId) return;

  const ip = getClientIp(req);

  const historyInput: CreateLoginHistoryInput = {
    userId,
    method: loginMethod,
    status: "failed" as LoginStatus,
    failReason,
    ip
  };

  withRetry(() => createLoginHistory(historyInput), {
    operationName: "recordFailedLogin",
    context: { userId: userId.toString(), loginMethod, failReason }
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
    loginMethod,
    req
  });

  Logger.info("Login successful", {
    email,
    userId: auth._id.toString(),
    method: loginMethod
  });

  return generateLoginTokens(auth);
};
