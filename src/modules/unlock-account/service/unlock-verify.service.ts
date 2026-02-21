import type { AuthenticationDocument } from "@/modules/authentication/types";
import type { UnlockVerifyRequest } from "../types";
import type { LoginResponse } from "@/modules/login/types";
import { Logger } from "@/utils/logger";
import { UnauthorizedError } from "@/configurations/responses/error";
import { getAuthenticationRepository } from "@/repositories/authentication";
import { isValidHashedValue } from "@/utils/crypto/bcrypt";
import { failedAttemptsStore } from "@/modules/login/store";
import { completeSuccessfulLogin } from "@/modules/login/service/shared";
import { LOGIN_METHODS } from "@/modules/login/constants";
import { withRetry } from "@/utils/retry";

function ensureAccountExists(
  auth: AuthenticationDocument | null,
  email: string,
  t: TranslateFunction
): asserts auth is AuthenticationDocument {
  if (auth) return;

  Logger.warn("Unlock verify failed - account not found", { email });
  throw new UnauthorizedError(t("unlock-account:errors.invalidTempPassword"));
}

const ensureTempPasswordSet = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.tempPasswordHash) return;

  Logger.warn("Unlock verify failed - no temp password set", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlock-account:errors.invalidTempPassword"));
};

const ensureTempPasswordNotExpired = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.tempPasswordExpAt && auth.tempPasswordExpAt >= new Date()) return;

  Logger.warn("Unlock verify failed - temp password expired", {
    email,
    authId: auth._id,
    expiredAt: auth.tempPasswordExpAt
  });

  throw new UnauthorizedError(t("unlock-account:errors.tempPasswordExpired"));
};

const ensureTempPasswordNotUsed = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (!auth.tempPasswordUsed) return;

  Logger.warn("Unlock verify failed - temp password already used", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlock-account:errors.invalidTempPassword"));
};

const verifyTempPasswordOrFail = async (
  auth: AuthenticationDocument,
  tempPassword: string,
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const isValid = auth.tempPasswordHash
    ? await isValidHashedValue(tempPassword, auth.tempPasswordHash)
    : false;

  if (isValid) return;

  Logger.warn("Unlock verify failed - invalid temp password", {
    email,
    authId: auth._id
  });

  throw new UnauthorizedError(t("unlock-account:errors.invalidTempPassword"));
};

export const handleUnlockVerify = async (
  req: UnlockVerifyRequest
): Promise<LoginResponse> => {
  const { email, tempPassword } = req.body;
  const { t } = req;

  Logger.info("Processing unlock verify", { email });

  const authRepo = getAuthenticationRepository();
  const auth = await authRepo.findByEmail(email);

  ensureAccountExists(auth, email, t);
  ensureTempPasswordSet(auth, email, t);
  ensureTempPasswordNotExpired(auth, email, t);
  ensureTempPasswordNotUsed(auth, email, t);
  await verifyTempPasswordOrFail(auth, tempPassword, email, t);

  Logger.info("Temp password verified successfully", {
    email,
    authId: auth._id
  });

  withRetry(() => failedAttemptsStore.resetAll(email), {
    operationName: "resetFailedAttemptsAfterUnlock",
    context: { email }
  });

  await authRepo.markTempPasswordUsed(auth._id.toString());

  Logger.info("Temp password marked as used", {
    email,
    authId: auth._id
  });

  const response = completeSuccessfulLogin({
    email,
    auth,
    loginMethod: LOGIN_METHODS.PASSWORD,
    req
  });

  Logger.info("Unlock successful - tokens generated", {
    email,
    authId: auth._id
  });

  return response;
};
