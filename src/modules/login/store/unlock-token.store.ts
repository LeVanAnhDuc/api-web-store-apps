import * as crypto from "crypto";
import { buildKey } from "./helpers";
import {
  redisGet,
  redisSetEx,
  redisDel
} from "@/app/utils/store/redis-operations";
import { REDIS_KEYS } from "@/app/constants/redis";
import { ACCOUNT_UNLOCK_CONFIG } from "@/modules/login/constants";
import { generateSecureToken } from "@/app/utils/crypto/otp";

const KEYS = {
  UNLOCK_TOKEN: REDIS_KEYS.LOGIN.UNLOCK_TOKEN
};

export const unlockTokenStore = {
  createToken: (): string =>
    generateSecureToken(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH),

  storeHashed: async (
    email: string,
    token: string,
    expiry: number
  ): Promise<void> => {
    const key = buildKey(KEYS.UNLOCK_TOKEN, email);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await redisSetEx(key, expiry, hashedToken);
  },

  verifyToken: async (email: string, token: string): Promise<boolean> => {
    const key = buildKey(KEYS.UNLOCK_TOKEN, email);
    const storedHash = await redisGet(key);

    if (!storedHash) return false;

    const providedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(providedHash)
    );
  },

  clearToken: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.UNLOCK_TOKEN, email);
    await redisDel(key);
  }
};
