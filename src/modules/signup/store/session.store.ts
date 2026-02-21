import { buildKey } from "@/utils/store";
import { redisGet, redisSetEx, redisDel } from "@/utils/store/redis-operations";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { generateSecureToken } from "@/utils/crypto/otp";
import { SESSION_CONFIG } from "@/constants/config";

const KEYS = {
  SESSION: REDIS_KEYS.SIGNUP.SESSION
};

export const sessionStore = {
  createToken: (): string => generateSecureToken(SESSION_CONFIG.TOKEN_LENGTH),

  store: async (
    email: string,
    sessionId: string,
    expiry: number
  ): Promise<void> => {
    const key = buildKey(KEYS.SESSION, email);
    await redisSetEx(key, expiry, sessionId);
  },

  verify: async (email: string, sessionId: string): Promise<boolean> => {
    const key = buildKey(KEYS.SESSION, email);
    const storedSessionId = await redisGet(key);
    return storedSessionId === sessionId;
  },

  clear: async (email: string): Promise<void> => {
    const key = buildKey(KEYS.SESSION, email);
    await redisDel(key);
  }
};
