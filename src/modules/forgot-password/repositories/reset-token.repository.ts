import type { RedisClientType } from "redis";
import RedisCache from "@/core/implements/RedisCache";
import { generateSecureToken } from "@/utils/crypto/otp";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { Logger } from "@/utils/logger";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { FORGOT_PASSWORD_RESET_TOKEN_CONFIG } from "@/constants/config";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";

const KEY = REDIS_KEYS.FORGOT_PASSWORD.RESET_TOKEN;

export class ResetTokenRepository extends RedisCache {
  readonly RESET_TOKEN_EXPIRY_SECONDS =
    FORGOT_PASSWORD_RESET_TOKEN_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;

  constructor(client: RedisClientType) {
    super(client, "ResetTokenRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private resetTokenKey(email: string): string {
    return this.buildKey(KEY, email);
  }

  // ──────────────────────────────────────────────
  // Token operations
  // ──────────────────────────────────────────────

  createToken(): string {
    return generateSecureToken(FORGOT_PASSWORD_RESET_TOKEN_CONFIG.TOKEN_LENGTH);
  }

  async storeHashed(email: string, token: string): Promise<void> {
    const key = this.resetTokenKey(email);
    const hashedToken = hashValue(token);
    await this.client.setEx(key, this.RESET_TOKEN_EXPIRY_SECONDS, hashedToken);
  }

  async verify(email: string, token: string): Promise<boolean> {
    const key = this.resetTokenKey(email);
    const storedHash = await this.client.get(key);

    if (!storedHash) return false;

    return isValidHashedValue(token, storedHash);
  }

  async clear(email: string): Promise<void> {
    const key = this.resetTokenKey(email);
    await this.client.del(key);
  }

  // ──────────────────────────────────────────────
  // Composite operations
  // ──────────────────────────────────────────────

  async createAndStore(email: string): Promise<string> {
    const token = this.createToken();

    await this.clear(email);
    await this.storeHashed(email, token);

    Logger.debug("Reset token created and stored", {
      email,
      expiresInSeconds: this.RESET_TOKEN_EXPIRY_SECONDS
    });

    return token;
  }
}
