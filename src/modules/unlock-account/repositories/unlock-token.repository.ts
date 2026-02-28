import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { generateSecureToken } from "@/utils/crypto/otp";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { ACCOUNT_UNLOCK_CONFIG } from "@/constants/config";

const KEYS = {
  UNLOCK_TOKEN: REDIS_KEYS.LOGIN.UNLOCK_TOKEN
};

// NOTE: Currently unused - created to maintain consistency
export class UnlockTokenRepository extends RedisCache {
  constructor(client: RedisClientType) {
    super(client, "UnlockTokenRepository", {
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

  // ──────────────────────────────────────────────
  // Operations
  // ──────────────────────────────────────────────

  createToken(): string {
    return generateSecureToken(ACCOUNT_UNLOCK_CONFIG.UNLOCK_TOKEN_LENGTH);
  }

  async storeHashed(
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
}
