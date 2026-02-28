import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { generateSecureToken } from "@/utils/crypto/otp";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { ACCOUNT_UNLOCK_CONFIG } from "@/constants/config";

const KEYS = {
  UNLOCK_TOKEN: REDIS_KEYS.LOGIN.UNLOCK_TOKEN,
  COOLDOWN: REDIS_KEYS.LOGIN.UNLOCK_COOLDOWN,
  RATE: REDIS_KEYS.LOGIN.UNLOCK_RATE
};

const COOLDOWN_SECONDS = 60;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_REQUESTS_PER_HOUR = 3;

export class UnlockAccountRepository extends RedisCache {
  readonly COOLDOWN_SECONDS = COOLDOWN_SECONDS;
  readonly MAX_REQUESTS_PER_HOUR = MAX_REQUESTS_PER_HOUR;

  constructor(client: RedisClientType) {
    super(client, "UnlockAccountRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private unlockTokenKey(email: string): string {
    return this.buildKey(KEYS.UNLOCK_TOKEN, email);
  }

  private cooldownKey(email: string): string {
    return this.buildKey(KEYS.COOLDOWN, email);
  }

  private rateKey(email: string): string {
    return this.buildKey(KEYS.RATE, email);
  }

  // ──────────────────────────────────────────────
  // Token operations (currently unused)
  // ──────────────────────────────────────────────

  createToken(): string {
    return generateSecureToken(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH);
  }

  async storeTokenHashed(
    email: string,
    token: string,
    expiry: number
  ): Promise<void> {
    const key = this.unlockTokenKey(email);
    const hashedToken = hashValue(token);
    await this.client.setEx(key, expiry, hashedToken);
  }

  async verifyToken(email: string, token: string): Promise<boolean> {
    const key = this.unlockTokenKey(email);
    const storedHash = await this.client.get(key);

    if (!storedHash) return false;

    return isValidHashedValue(token, storedHash);
  }

  async clearToken(email: string): Promise<void> {
    const key = this.unlockTokenKey(email);
    await this.client.del(key);
  }

  // ──────────────────────────────────────────────
  // Cooldown operations
  // ──────────────────────────────────────────────

  async getCooldownRemaining(email: string): Promise<number> {
    const key = this.cooldownKey(email);
    const ttl = await this.client.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  async setCooldown(email: string): Promise<void> {
    const key = this.cooldownKey(email);
    await this.client.setEx(key, COOLDOWN_SECONDS, "1");
  }

  // ──────────────────────────────────────────────
  // Rate limit operations
  // ──────────────────────────────────────────────

  async incrementRequestCount(email: string): Promise<number> {
    const key = this.rateKey(email);
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }

    return count;
  }

  hasExceededRateLimit(requestCount: number): boolean {
    return requestCount > MAX_REQUESTS_PER_HOUR;
  }
}
