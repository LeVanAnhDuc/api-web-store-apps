import type {
  MagicLinkVerifyRequest,
  LoginResponse
} from "@/modules/login/types";
import type { AuthenticationDocument } from "@/modules/authentication/types";
import { UnauthorizedError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { magicLinkStore } from "@/modules/login/store";
import { ensureAuthenticationExists } from "../validators";
import { recordFailedLogin, completeSuccessfulLogin } from "../shared";
import { LOGIN_METHODS, LOGIN_FAIL_REASONS } from "@/modules/login/constants";

const handleInvalidToken = (
  email: string,
  auth: AuthenticationDocument,
  req: MagicLinkVerifyRequest,
  t: TranslateFunction
): never => {
  recordFailedLogin({
    userId: auth._id,
    usernameAttempted: email,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
    req
  });

  Logger.warn("Magic link verification failed - invalid token", { email });
  throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
};

export const verifyMagicLinkService = async (
  req: MagicLinkVerifyRequest
): Promise<Partial<ResponsePattern<LoginResponse>>> => {
  const { email, token } = req.body;
  const { t } = req;

  Logger.info("Magic link verification initiated", { email });

  const auth = await ensureAuthenticationExists(email, t);

  const isValid = await magicLinkStore.verifyToken(email, token);

  if (!isValid) handleInvalidToken(email, auth, req, t);

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
};
