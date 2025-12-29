/**
 * Magic Link Send Service
 * Use Case: User requests magic link for passwordless login
 *
 * Business Flow:
 * 1. Ensure cooldown period has expired
 * 2. Ensure email exists and account is active
 * 3. Generate and store magic link token (hashed)
 * 4. Start cooldown period
 * 5. Send magic link email (async, fire-and-forget)
 *
 * Rate Limiting: Handled by middleware (IP + Email)
 * Validation: Handled by schema layer
 */

// libs
import i18next from "@/i18n";

// types
import type { TFunction } from "i18next";
import type {
  MagicLinkSendRequest,
  MagicLinkSendResponse
} from "@/shared/types/modules/login";

// errors
import { BadRequestError, UnauthorizedError } from "@/core/responses/error";

// utils
import { Logger } from "@/core/utils/logger";

// repository
import { findAuthByEmail } from "@/modules/login/repository";

// store
import {
  checkMagicLinkCooldown,
  getMagicLinkCooldownRemaining,
  setMagicLinkCooldown,
  createAndStoreMagicLink,
  deleteMagicLink,
  generateMagicLinkToken
} from "@/modules/login/utils/store";

// notifier
import { notifyMagicLinkByEmail } from "@/modules/login/notifier";

// constants
import { MAGIC_LINK_CONFIG } from "@/shared/constants/modules/session";
import { SECONDS_PER_MINUTE } from "@/shared/constants/time";

// =============================================================================
// Configuration
// =============================================================================

const TIME_MAGIC_LINK_EXPIRES =
  MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const TIME_MAGIC_LINK_COOLDOWN = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

// =============================================================================
// Business Rule Checks (Guard Functions)
// =============================================================================

const ensureCooldownExpired = async (
  email: string,
  language: string
): Promise<void> => {
  const canSend = await checkMagicLinkCooldown(email);

  if (!canSend) {
    const remaining = await getMagicLinkCooldownRemaining(email);
    Logger.warn("Magic link cooldown not expired", { email, remaining });
    throw new BadRequestError(
      i18next.t("login:errors.magicLinkCooldown", {
        seconds: remaining,
        lng: language
      })
    );
  }
};

const ensureEmailExists = async (
  email: string,
  t: TFunction
): Promise<void> => {
  const auth = await findAuthByEmail(email);

  if (!auth) {
    // Don't reveal if email exists - generic error
    Logger.warn("Magic link requested for non-existent email", { email });
    throw new UnauthorizedError(t("login:errors.invalidEmail"));
  }

  if (!auth.isActive) {
    Logger.warn("Magic link requested for inactive account", { email });
    throw new UnauthorizedError(t("login:errors.accountInactive"));
  }

  if (!auth.verifiedEmail) {
    Logger.warn("Magic link requested for unverified email", { email });
    throw new UnauthorizedError(t("login:errors.emailNotVerified"));
  }
};

// =============================================================================
// Business Operations
// =============================================================================

const createNewMagicLink = async (email: string): Promise<string> => {
  const token = generateMagicLinkToken();

  // Delete existing magic link first (idempotency)
  await deleteMagicLink(email);
  await createAndStoreMagicLink(email, token, TIME_MAGIC_LINK_EXPIRES);

  Logger.debug("Magic link created and stored", {
    email,
    expiresInSeconds: TIME_MAGIC_LINK_EXPIRES
  });

  return token;
};

const startCooldown = async (email: string): Promise<void> => {
  await setMagicLinkCooldown(email, TIME_MAGIC_LINK_COOLDOWN);

  Logger.debug("Magic link cooldown started", {
    email,
    cooldownSeconds: TIME_MAGIC_LINK_COOLDOWN
  });
};

// =============================================================================
// Main Service
// =============================================================================

export const sendMagicLink = async (
  req: MagicLinkSendRequest
): Promise<Partial<ResponsePattern<MagicLinkSendResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("Magic link send initiated", { email });

  await ensureCooldownExpired(email, language);
  await ensureEmailExists(email, t);

  const token = await createNewMagicLink(email);

  await startCooldown(email);

  notifyMagicLinkByEmail(email, token, language as I18n.Locale);

  Logger.info("Magic link send completed", {
    email,
    expiresIn: TIME_MAGIC_LINK_EXPIRES,
    cooldown: TIME_MAGIC_LINK_COOLDOWN
  });

  return {
    message: t("login:success.magicLinkSent"),
    data: {
      success: true,
      expiresIn: TIME_MAGIC_LINK_EXPIRES,
      cooldown: TIME_MAGIC_LINK_COOLDOWN
    }
  };
};
