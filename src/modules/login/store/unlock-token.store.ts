import {
  redisGet,
  redisSetEx,
  redisDel
} from "@/app/utils/store/redis-operations";
import { REDIS_KEYS } from "@/constants/redis";
import { ACCOUNT_UNLOCK_CONFIG } from "@/modules/login/constants";
import { generateSecureToken } from "@/app/utils/crypto/otp";
import { buildKey } from "@/app/utils/store";
import { hashValue, isValidHashedValue } from "@/app/utils/crypto/bcrypt";

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
    const hashedToken = hashValue(token);
    await redisSetEx(key, expiry, hashedToken);
  },

  verifyToken: async (email: string, token: string): Promise<boolean> => {
    const key = buildKey(KEYS.UNLOCK_TOKEN, email);
    const storedHash = await redisGet(key);

    if (!storedHash) return false;

    return isValidHashedValue(token, storedHash);
  },

  clearToken: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.UNLOCK_TOKEN, email);
    await redisDel(key);
  }
};
