import instanceRedis from "@/database/redis/redis.database";
import { Logger } from "@/utils/logger";

const getRedisClient = () => instanceRedis.getClient();

export const redisGet = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (error) {
    Logger.error("Redis GET failed", { key, error });
    return null;
  }
};

export const redisSetEx = async (
  key: string,
  ttlSeconds: number,
  value: string
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttlSeconds, value);
  } catch (error) {
    Logger.error("Redis SETEX failed", { key, ttlSeconds, error });
  }
};

export const redisDel = async (...keys: string[]): Promise<number> => {
  try {
    const client = getRedisClient();
    return await client.del(keys);
  } catch (error) {
    Logger.error("Redis DEL failed", { keys, error });
    return 0;
  }
};

export const redisExists = async (key: string): Promise<number> => {
  try {
    const client = getRedisClient();
    return await client.exists(key);
  } catch (error) {
    Logger.error("Redis EXISTS failed", { key, error });
    return 0;
  }
};

export const redisIncr = async (key: string): Promise<number> => {
  try {
    const client = getRedisClient();
    return await client.incr(key);
  } catch (error) {
    Logger.error("Redis INCR failed", { key, error });
    return 0;
  }
};

export const redisExpire = async (
  key: string,
  seconds: number
): Promise<boolean> => {
  try {
    const client = getRedisClient();
    return await client.expire(key, seconds);
  } catch (error) {
    Logger.error("Redis EXPIRE failed", { key, seconds, error });
    return false;
  }
};

export const redisTtl = async (key: string): Promise<number> => {
  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    Logger.error("Redis TTL failed", { key, error });
    return -1;
  }
};
