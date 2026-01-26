import instanceRedis from "@/database/redis/redis.database";
import { CacheStore } from "@/app/services/abstracts/CacheStore";
import { Logger } from "@/infra/utils/logger";

export class RedisCacheStore extends CacheStore {
  private static instance: RedisCacheStore | null = null;

  public static getInstance(): RedisCacheStore {
    if (this.instance === null) {
      this.instance = new RedisCacheStore();
    }
    return this.instance;
  }

  private getClient() {
    return instanceRedis.getClient();
  }

  get isConnected(): boolean {
    try {
      const client = this.getClient();
      return client.isOpen;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient();
      return await client.get(key);
    } catch (error) {
      Logger.error("Redis GET failed", { key, error });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const client = this.getClient();

      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      Logger.error("Redis SET failed", { key, error });
    }
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.setEx(key, ttlSeconds, value);
    } catch (error) {
      Logger.error("Redis SETEX failed", { key, ttlSeconds, error });
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      const client = this.getClient();
      return await client.del(keys);
    } catch (error) {
      Logger.error("Redis DEL failed", { keys, error });
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.exists(key);
    } catch (error) {
      Logger.error("Redis EXISTS failed", { key, error });
      return 0;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.incr(key);
    } catch (error) {
      Logger.error("Redis INCR failed", { key, error });
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = this.getClient();
      return await client.expire(key, seconds);
    } catch (error) {
      Logger.error("Redis EXPIRE failed", { key, seconds, error });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      Logger.error("Redis TTL failed", { key, error });
      return -1;
    }
  }
}

const cacheStore = RedisCacheStore.getInstance();

export default cacheStore;
