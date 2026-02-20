import type {
  MagicLinkSendRequest,
  MagicLinkSendResponse
} from "@/modules/login/types";
import { Logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { magicLinkStore } from "@/modules/login/store";
import {
  ensureCooldownExpired,
  validateAuthenticationForLogin
} from "../validators";
import { sendModuleEmail } from "@/utils/email/sender";
import ENV from "@/infra/configs/env";
import { MAGIC_LINK_CONFIG } from "@/modules/login/constants";
import { SECONDS_PER_MINUTE } from "@/constants/time";

const MAGIC_LINK_EXPIRY_SECONDS =
  MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
const MAGIC_LINK_COOLDOWN_SECONDS = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

const createAndStoreToken = async (email: string): Promise<string> => {
  const token = magicLinkStore.createToken();

  await magicLinkStore.clearToken(email);
  await magicLinkStore.storeHashed(email, token, MAGIC_LINK_EXPIRY_SECONDS);

  Logger.debug("Magic link created and stored", {
    email,
    expiresInSeconds: MAGIC_LINK_EXPIRY_SECONDS
  });

  return token;
};

const setMagicLinkCooldown = async (email: string): Promise<void> => {
  await magicLinkStore.setCooldown(email, MAGIC_LINK_COOLDOWN_SECONDS);

  Logger.debug("Magic link cooldown set", {
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

  await ensureCooldownExpired(
    magicLinkStore,
    email,
    t,
    "Magic link cooldown not expired",
    "login:errors.magicLinkCooldown"
  );
  await validateAuthenticationForLogin(email, t);

  const token = await createAndStoreToken(email);

  withRetry(() => setMagicLinkCooldown(email), {
    operationName: "setMagicLinkCooldown",
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
