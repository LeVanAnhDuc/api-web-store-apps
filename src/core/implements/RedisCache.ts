import type { RedisClientType } from "redis";
import BaseCache from "../BaseCache";

class RedisCache extends BaseCache {
  protected readonly client: RedisClientType;
  protected readonly keyPrefix: string;

  constructor(
    client: RedisClientType,
    name: string,
    options: {
      cacheEnabled?: boolean;
      keyPrefix?: string;
      ttl?: number;
    } = {}
  ) {
    super(name, {
      cacheEnabled: options.cacheEnabled,
      ttl: options.ttl
    });
    this.client = client;
    this.keyPrefix = options.keyPrefix ?? `${name}:`;
  }

  buildKey(...args: unknown[]): string {
    const parts = args.map((arg) => String(arg));
    return `${this.keyPrefix}${parts.join(":")}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled) return null;

    try {
      const fullKey = this.buildKey(key);
      const data = await this.client.get(fullKey);

      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache get failed: ${message}`);
    }
  }

  async put<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(value);
      const cacheTTL = ttl ?? this.ttl;

      if (cacheTTL) {
        await this.client.setEx(fullKey, cacheTTL, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache put failed: ${message}`);
    }
  }

  async evict(key: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const fullKey = this.buildKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache evict failed: ${message}`);
    }
  }

  async evictAll(pattern?: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      const searchPattern = pattern
        ? `${this.keyPrefix}${pattern}`
        : `${this.keyPrefix}*`;
      const keys = await this.client.keys(searchPattern);

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache evict all failed: ${message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const exists = await this.client.exists(fullKey);
      return exists === 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache exists check failed: ${message}`);
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Get TTL failed: ${message}`);
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.incrBy(fullKey, amount);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache increment failed: ${message}`);
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.decrBy(fullKey, amount);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache decrement failed: ${message}`);
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.cacheEnabled || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map((key) => this.buildKey(key));
      const values = await this.client.mGet(fullKeys);

      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache get many failed: ${message}`);
    }
  }

  async putMany<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    if (!this.cacheEnabled || entries.length === 0) return;

    try {
      const multi = this.client.multi();

      for (const { key, value, ttl } of entries) {
        const fullKey = this.buildKey(key);
        const serialized = JSON.stringify(value);
        const cacheTTL = ttl ?? this.ttl;

        if (cacheTTL) {
          multi.setEx(fullKey, cacheTTL, serialized);
        } else {
          multi.set(fullKey, serialized);
        }
      }

      await multi.exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache put many failed: ${message}`);
    }
  }

  async evictMany(keys: string[]): Promise<void> {
    if (!this.cacheEnabled || keys.length === 0) return;

    try {
      const fullKeys = keys.map((key) => this.buildKey(key));
      await this.client.del(fullKeys);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cache evict many failed: ${message}`);
    }
  }
}

export default RedisCache;
