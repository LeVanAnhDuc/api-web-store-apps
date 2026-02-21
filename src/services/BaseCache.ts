abstract class BaseCache {
  protected readonly name: string;
  protected readonly cacheEnabled: boolean;
  protected readonly ttl?: number;

  constructor(
    name: string,
    options: { cacheEnabled?: boolean; ttl?: number } = {}
  ) {
    this.name = name;
    this.cacheEnabled = options.cacheEnabled ?? false;
    this.ttl = options.ttl;
  }

  abstract buildKey(...args: unknown[]): string;

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (!this.cacheEnabled) {
      return await fetchFn();
    }

    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.put(key, value, ttl);

    return value;
  }

  abstract get<T>(key: string): Promise<T | null>;

  abstract put<T>(key: string, value: T, ttl?: number): Promise<void>;

  abstract evict(key: string): Promise<void>;

  abstract evictAll(pattern?: string): Promise<void>;

  abstract has(key: string): Promise<boolean>;
}

export default BaseCache;
