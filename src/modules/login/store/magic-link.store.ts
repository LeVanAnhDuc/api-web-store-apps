import {
  redisGet,
  redisSetEx,
  redisDel,
  redisTtl,
  redisExists
} from "@/app/utils/store/redis-operations";
import { REDIS_KEYS } from "@/constants/redis";
import { MAGIC_LINK_CONFIG } from "@/modules/login/constants";
import { generateSecureToken } from "@/app/utils/crypto/otp";
import { buildKey } from "@/app/utils/store";
import { hashValue, isValidHashedValue } from "@/app/utils/crypto/bcrypt";

const KEYS = {
  MAGIC_LINK: REDIS_KEYS.LOGIN.MAGIC_LINK,
  COOLDOWN: REDIS_KEYS.LOGIN.MAGIC_LINK_COOLDOWN
};

export const magicLinkStore = {
  createToken: (): string =>
    generateSecureToken(MAGIC_LINK_CONFIG.TOKEN_LENGTH),

  checkCooldown: async (email: string): Promise<boolean> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const exists = await redisExists(key);
    return exists === 0;
  },

  getCooldownRemaining: async (email: string): Promise<number> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    const ttl = await redisTtl(key);
    return ttl > 0 ? ttl : 0;
  },

  setCooldown: async (email: string, seconds: number): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisSetEx(key, seconds, "1");
  },

  clearCooldown: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.COOLDOWN, email);
    await redisDel(key);
  },

  storeHashed: async (
    email: string,
    token: string,
    expiry: number
  ): Promise<void> => {
    const key = buildKey(KEYS.MAGIC_LINK, email);
    const hashedToken = hashValue(token);
    await redisSetEx(key, expiry, hashedToken);
  },

  verifyToken: async (email: string, token: string): Promise<boolean> => {
    const key = buildKey(KEYS.MAGIC_LINK, email);
    const storedHash = await redisGet(key);

    if (!storedHash) return false;

    return isValidHashedValue(token, storedHash);
  },

  clearToken: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.MAGIC_LINK, email);
    await redisDel(key);
  },

  cleanupAll: async (email: string): Promise<void> => {
    await Promise.all([
      magicLinkStore.clearToken(email),
      magicLinkStore.clearCooldown(email)
    ]);
  }
};
