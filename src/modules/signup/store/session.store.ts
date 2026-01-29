import { buildKey } from "@/app/utils/store";
import {
  redisGet,
  redisSetEx,
  redisDel
} from "@/app/utils/store/redis-operations";
import { REDIS_KEYS } from "@/app/constants/redis";

const KEYS = {
  SESSION: REDIS_KEYS.SIGNUP.SESSION
};

export const sessionStore = {
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
