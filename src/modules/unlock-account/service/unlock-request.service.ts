import type { AuthenticationDocument } from "@/modules/authentication/types";
import { Logger } from "@/utils/logger";
import {
  BadRequestError,
  TooManyRequestsError
} from "@/configurations/responses/error";
import {
  redisTtl,
  redisIncr,
  redisExpire,
  redisSetEx
} from "@/utils/store/redis-operations";
import { REDIS_KEYS } from "@/constants/redis";
import {
  findAuthenticationByEmail,
  storeTempPassword
} from "@/modules/login/repository";
import { generateTempPassword } from "@/utils/crypto/tempPassword";
import { hashValue } from "@/utils/crypto/bcrypt";
import { failedAttemptsStore } from "@/modules/login/store";
import { sendModuleEmail } from "@/utils/email/sender";
import ENV from "@/configurations/env";

const COOLDOWN_SECONDS = 60;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_UNLOCK_REQUESTS_PER_HOUR = 3;
const TEMP_PASSWORD_EXPIRY_MINUTES = 15;

const sendUnlockEmail = (
  email: string,
  tempPassword: string,
  t: TranslateFunction,
  locale: I18n.Locale
): void => {
  const subject = t("unlock-account:email.unlockSubject");

  sendModuleEmail("unlock-account", email, locale, {
    templateName: "unlock-temp-password",
    subject,
    variables: {
      subject,
      greeting: t("unlock-account:email.unlockGreeting"),
      message: t("unlock-account:email.unlockMessage"),
      passwordLabel: t("unlock-account:email.tempPasswordLabel"),
      tempPassword,
      passwordExpiry: t("unlock-account:email.tempPasswordExpiry"),
      securityWarning: t("unlock-account:email.securityWarning"),
      loginButton: t("unlock-account:email.loginButton"),
      loginUrl: ENV.CLIENT_URL || "http://localhost:3000/login",
      footer: t("unlock-account:email.footer")
    }
  })
    .then(() => undefined)
    .catch((error) => {
      Logger.error("Unlock email delivery failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    });
};

const checkCooldown = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const cooldownKey = `${REDIS_KEYS.LOGIN.UNLOCK_COOLDOWN}:${email}`;
  const ttl = await redisTtl(cooldownKey);

  if (ttl > 0) {
    Logger.warn("Unlock request blocked - cooldown active", {
      email,
      remainingSeconds: ttl
    });

    throw new BadRequestError(
      t("unlock-account:errors.unlockCooldown", { seconds: ttl })
    );
  }
};

const checkRateLimit = async (
  email: string,
  t: TranslateFunction
): Promise<void> => {
  const rateLimitKey = `${REDIS_KEYS.LOGIN.UNLOCK_RATE}:${email}`;
  const requestCount = await redisIncr(rateLimitKey);

  if (requestCount === 1) {
    await redisExpire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
  }

  if (requestCount > MAX_UNLOCK_REQUESTS_PER_HOUR) {
    Logger.warn("Unlock request blocked - rate limit exceeded", {
      email,
      requestCount
    });

    throw new TooManyRequestsError(t("unlock-account:errors.unlockRateLimit"));
  }

  Logger.info("Unlock rate limit check passed", {
    email,
    requestCount,
    limit: MAX_UNLOCK_REQUESTS_PER_HOUR
  });
};

const setCooldown = async (email: string): Promise<void> => {
  const cooldownKey = `${REDIS_KEYS.LOGIN.UNLOCK_COOLDOWN}:${email}`;
  await redisSetEx(cooldownKey, COOLDOWN_SECONDS, "1");

  Logger.debug("Unlock cooldown set", {
    email,
    seconds: COOLDOWN_SECONDS
  });
};

const ensureAccountActive = (
  auth: AuthenticationDocument,
  email: string,
  t: TranslateFunction
): void => {
  if (auth.isActive) return;

  Logger.warn("Unlock request for disabled account", {
    email,
    authId: auth._id
  });

  throw new BadRequestError(t("unlock-account:errors.accountDisabled"));
};

const ensureAccountLocked = async (
  email: string,
  auth: AuthenticationDocument,
  t: TranslateFunction
): Promise<void> => {
  const { isLocked } = await failedAttemptsStore.checkLockout(email);

  if (isLocked) return;

  Logger.info("Unlock request for non-locked account", {
    email,
    authId: auth._id
  });

  throw new BadRequestError(t("unlock-account:errors.accountNotLocked"));
};

export const handleUnlockRequest = async (
  email: string,
  t: TranslateFunction,
  language: string
): Promise<{ success: boolean }> => {
  Logger.info("Processing unlock request", { email });

  await checkCooldown(email, t);
  await checkRateLimit(email, t);

  const auth = await findAuthenticationByEmail(email);

  if (!auth) {
    Logger.warn("Unlock request for non-existent email", { email });
    await setCooldown(email);
    return { success: true };
  }

  ensureAccountActive(auth, email, t);
  await ensureAccountLocked(email, auth, t);

  const tempPassword = generateTempPassword();
  const tempPasswordHash = await hashValue(tempPassword);
  const tempPasswordExpAt = new Date(
    Date.now() + TEMP_PASSWORD_EXPIRY_MINUTES * 60 * 1000
  );

  await storeTempPassword(
    auth._id.toString(),
    tempPasswordHash,
    tempPasswordExpAt
  );

  Logger.info("Temporary password generated and saved", {
    email,
    authId: auth._id,
    expiresAt: tempPasswordExpAt
  });

  sendUnlockEmail(email, tempPassword, t, language as I18n.Locale);

  await setCooldown(email);

  Logger.info("Unlock email sent successfully", { email });

  return { success: true };
};
