/**
 * Magic Link Verify Service
 * Use Case: User clicks magic link to complete passwordless login
 *
 * Business Flow:
 * 1. Verify magic link token
 * 2. On success: Create session, cleanup data, record history
 * 3. On failure: Record failed attempt
 *
 * Rate Limiting: Handled by middleware
 * Validation: Handled by schema layer
 */

// types
import type {
  MagicLinkVerifyRequest,
  LoginWithSessionResponse
} from "@/shared/types/modules/login";

// errors
import { UnauthorizedError } from "@/core/responses/error";

// utils
import { Logger } from "@/core/utils/logger";

// repository
import { findAuthByEmail } from "@/modules/login/repository";

// store
import {
  verifyMagicLinkToken,
  cleanupMagicLinkData
} from "@/modules/login/utils/store";

// shared
import {
  createLoginSession,
  recordSuccessfulLogin,
  recordFailedLogin
} from "./shared";

// constants
import {
  LOGIN_METHODS,
  LOGIN_FAIL_REASONS
} from "@/shared/constants/modules/session";

// =============================================================================
// Main Service
// =============================================================================

export const verifyMagicLink = async (
  req: MagicLinkVerifyRequest
): Promise<Partial<ResponsePattern<LoginWithSessionResponse>>> => {
  const { email, token } = req.body;
  const { t } = req;

  Logger.info("Magic link verification initiated", { email });

  const auth = await findAuthByEmail(email);

  if (!auth) {
    Logger.warn("Magic link verification failed - email not found", { email });
    throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
  }

  const isValid = await verifyMagicLinkToken(email, token);

  if (!isValid) {
    await recordFailedLogin({
      userId: auth._id,
      loginMethod: LOGIN_METHODS.MAGIC_LINK,
      failReason: LOGIN_FAIL_REASONS.INVALID_MAGIC_LINK,
      req
    });

    Logger.warn("Magic link verification failed - invalid token", { email });
    throw new UnauthorizedError(t("login:errors.invalidMagicLink"));
  }

  await cleanupMagicLinkData(email);

  const loginResponse = await createLoginSession({
    auth,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    req
  });

  await recordSuccessfulLogin({
    userId: auth._id,
    loginMethod: LOGIN_METHODS.MAGIC_LINK,
    req
  });

  Logger.info("Magic link verification successful", {
    email,
    userId: auth._id.toString()
  });

  return {
    message: t("login:success.loginSuccessful"),
    data: loginResponse
  };
};
