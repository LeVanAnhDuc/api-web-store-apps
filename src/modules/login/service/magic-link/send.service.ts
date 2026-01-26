import i18next from "@/i18n";
import type { TFunction } from "i18next";
import type {
  MagicLinkSendRequest,
  MagicLinkSendResponse
} from "@/modules/login/types";
import { BadRequestError, UnauthorizedError } from "@/infra/responses/error";
import { Logger } from "@/infra/utils/logger";
import { withRetry } from "@/infra/utils/retry";
import { findAuthenticationByEmail } from "@/modules/login/repository";
import loginCacheStore from "@/modules/login/store/LoginCacheStore";
import { sendModuleEmail } from "@/app/utils/email/sender";
import ENV from "@/infra/configs/env";
import { MAGIC_LINK_CONFIG } from "@/modules/login/constants";
import { SECONDS_PER_MINUTE } from "@/app/constants/time";

const MAGIC_LINK_EXPIRY_SECONDS =
  MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const MAGIC_LINK_COOLDOWN_SECONDS = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

const ensureCooldownExpired = async (
  email: string,
  language: string
): Promise<void> => {
  const canSend = await loginCacheStore.checkMagicLinkCooldown(email);

  if (!canSend) {
    const remaining =
      await loginCacheStore.getMagicLinkCooldownRemaining(email);
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
  const auth = await findAuthenticationByEmail(email);

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

const createNewMagicLink = async (email: string): Promise<string> => {
  const token = loginCacheStore.generateMagicLinkToken();

  // Ensure idempotency by deleting existing magic link first
  await loginCacheStore.deleteMagicLink(email);
  await loginCacheStore.createAndStoreMagicLink(
    email,
    token,
    MAGIC_LINK_EXPIRY_SECONDS
  );

  Logger.debug("Magic link created and stored", {
    email,
    expiresInSeconds: MAGIC_LINK_EXPIRY_SECONDS
  });

  return token;
};

const applyMagicLinkRateLimits = async (email: string): Promise<void> => {
  await loginCacheStore.setMagicLinkCooldown(
    email,
    MAGIC_LINK_COOLDOWN_SECONDS
  );

  Logger.debug("Magic link rate limits applied", {
    email,
    cooldownSeconds: MAGIC_LINK_COOLDOWN_SECONDS
  });
};

const sendMagicLinkEmail = (
  email: string,
  token: string,
  locale: I18n.Locale
): void => {
  const magicLinkUrl = `${ENV.CLIENT_URL}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  sendModuleEmail("login", email, locale, {
    templateName: "magic-link",
    subject: "Magic Link Login",
    variables: {
      magicLinkUrl,
      expiryMinutes: MAGIC_LINK_CONFIG.EXPIRY_MINUTES
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Magic link email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};

export const sendMagicLinkService = async (
  req: MagicLinkSendRequest
): Promise<Partial<ResponsePattern<MagicLinkSendResponse>>> => {
  const { email } = req.body;
  const { language, t } = req;

  Logger.info("Magic link send initiated", { email });

  await ensureCooldownExpired(email, language);
  await ensureEmailExists(email, t);

  const token = await createNewMagicLink(email);

  withRetry(() => applyMagicLinkRateLimits(email), {
    operationName: "applyMagicLinkRateLimits",
    context: { email }
  });

  sendMagicLinkEmail(email, token, language as I18n.Locale);

  Logger.info("Magic link send completed", {
    email,
    expiresIn: MAGIC_LINK_EXPIRY_SECONDS,
    cooldown: MAGIC_LINK_COOLDOWN_SECONDS
  });

  return {
    message: t("login:success.magicLinkSent"),
    data: {
      success: true,
      expiresIn: MAGIC_LINK_EXPIRY_SECONDS,
      cooldown: MAGIC_LINK_COOLDOWN_SECONDS
    }
  };
};
