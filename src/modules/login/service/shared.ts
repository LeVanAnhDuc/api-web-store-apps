import type { Schema } from "mongoose";
import type { Request } from "express";
import type { AuthDocument } from "@/modules/auth/types";
import type { LoginMethod } from "@/modules/login/types";
import type {
  CreateLoginHistoryInput,
  LoginStatus,
  LoginFailReason
} from "@/modules/login-history/types";
import type { LoginResponse } from "@/modules/login/types";
import { JsonWebTokenService } from "@/app/services/implements/JsonWebTokenService";
import { withRetry } from "@/infra/utils/retry";
import { getClientIp } from "@/modules/login/utils/device";
import { createLoginHistory } from "@/modules/login-history/repository";
import { updateLastLogin as updateLastLoginRepo } from "@/modules/login/repository";
import { TOKEN_EXPIRY } from "@/infra/configs/jwt";

export const generateLoginTokens = (auth: AuthDocument): LoginResponse => {
  const tokenPayload = {
    userId: auth._id.toString(),
    authId: auth._id.toString(),
    email: auth.email,
    roles: auth.roles
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

/**
 * Update last login timestamp (fire-and-forget with retry)
 */
export const updateLastLogin = (userId: string): void => {
  withRetry(() => updateLastLoginRepo(userId), {
    operationName: "updateLastLogin",
    context: { userId }
  });
};

/**
 * Record successful login in history (fire-and-forget with retry)
 */
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

/**
 * Record failed login in history (fire-and-forget with retry)
 */
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
