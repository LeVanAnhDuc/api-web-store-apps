export abstract class CacheStore {
  abstract get(key: string): Promise<string | null>;

  abstract set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  abstract setEx(key: string, ttlSeconds: number, value: string): Promise<void>;

  abstract del(...keys: string[]): Promise<number>;

  abstract exists(key: string): Promise<number>;

  abstract incr(key: string): Promise<number>;

  abstract expire(key: string, seconds: number): Promise<boolean>;

  abstract ttl(key: string): Promise<number>;

  abstract get isConnected(): boolean;

  // abstract mGet(keys: string[]): Promise<(string | null)[]>;
  // abstract mSet(entries: [string, string][]): Promise<void>;

  // abstract hGet(key: string, field: string): Promise<string | null>;
  // abstract hSet(key: string, field: string, value: string): Promise<void>;
  // abstract hGetAll(key: string): Promise<Record<string, string>>;
  // abstract hDel(key: string, ...fields: string[]): Promise<number>;

  // abstract lPush(key: string, ...values: string[]): Promise<number>;
  // abstract rPop(key: string): Promise<string | null>;
}
