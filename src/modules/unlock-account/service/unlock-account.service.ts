import type { LoginResponse } from "@/types/modules/login";
import type { UnlockVerifyRequest } from "@/types/modules/unlock-account";
import { Logger } from "@/utils/logger";
import { hashValue } from "@/utils/crypto/bcrypt";
import { withRetry } from "@/utils/retry";
import authenticationRepository from "@/repositories/authentication";
import { failedAttemptsStore } from "@/modules/login/store";
import { completeSuccessfulLogin } from "@/modules/login/service/helpers";
import { LOGIN_METHODS } from "@/constants/enums";
import { sendUnlockEmail } from "./emails";
import {
  checkCooldown,
  checkRateLimit,
  setCooldown,
  ensureAccountActive,
  ensureAccountLocked,
  ensureAccountExists,
  ensureTempPasswordSet,
  ensureTempPasswordNotExpired,
  ensureTempPasswordNotUsed,
  verifyTempPasswordOrFail,
  generateTempPassword,
  TEMP_PASSWORD_EXPIRY_MINUTES
} from "./helpers";

class UnlockAccountService {
  constructor(private readonly authRepo: typeof authenticationRepository) {}

  async unlockRequest(
    email: string,
    t: TranslateFunction,
    language: string
  ): Promise<{ success: boolean }> {
    Logger.info("Processing unlock request", { email });

    await checkCooldown(email, t);
    await checkRateLimit(email, t);

    const auth = await this.authRepo.findByEmail(email);

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

    await this.authRepo.storeTempPassword(
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
  }

  async unlockVerify(req: UnlockVerifyRequest): Promise<LoginResponse> {
    const { email, tempPassword } = req.body;
    const { t } = req;

    Logger.info("Processing unlock verify", { email });

    const auth = await this.authRepo.findByEmail(email);

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

    await this.authRepo.markTempPasswordUsed(auth._id.toString());

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
  }
}

export const unlockAccountService = new UnlockAccountService(
  authenticationRepository
);
