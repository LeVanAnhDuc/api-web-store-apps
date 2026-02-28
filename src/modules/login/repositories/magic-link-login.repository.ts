import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { generateSecureToken } from "@/utils/crypto/otp";
import { hashValue, isValidHashedValue } from "@/utils/crypto/bcrypt";
import { Logger } from "@/utils/logger";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { MAGIC_LINK_CONFIG } from "@/constants/config";
import { SECONDS_PER_MINUTE } from "@/constants/infrastructure";

const KEYS = {
  MAGIC_LINK: REDIS_KEYS.LOGIN.MAGIC_LINK,
  COOLDOWN: REDIS_KEYS.LOGIN.MAGIC_LINK_COOLDOWN
};

export class MagicLinkLoginRepository extends RedisCache {
  readonly MAGIC_LINK_EXPIRY_SECONDS =
    MAGIC_LINK_CONFIG.EXPIRY_MINUTES * SECONDS_PER_MINUTE;
  readonly MAGIC_LINK_COOLDOWN_SECONDS = MAGIC_LINK_CONFIG.COOLDOWN_SECONDS;

  constructor(client: RedisClientType) {
    super(client, "MagicLinkLoginRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private magicLinkKey(email: string): string {
    return this.buildKey(KEYS.MAGIC_LINK, email);
  }

  private cooldownKey(email: string): string {
    return this.buildKey(KEYS.COOLDOWN, email);
  }

  // ──────────────────────────────────────────────
  // Token operations
  // ──────────────────────────────────────────────

  createToken(): string {
    return generateSecureToken(MAGIC_LINK_CONFIG.TOKEN_LENGTH);
  }

  async storeHashed(
    email: string,
    token: string,
    expiry: number
  ): Promise<void> {
    const key = this.magicLinkKey(email);
    const hashedToken = hashValue(token);
    await this.client.setEx(key, expiry, hashedToken);
  }

  async verifyToken(email: string, token: string): Promise<boolean> {
    const key = this.magicLinkKey(email);
    const storedHash = await this.client.get(key);

    if (!storedHash) return false;

    return isValidHashedValue(token, storedHash);
  }

  async clearToken(email: string): Promise<void> {
    const key = this.magicLinkKey(email);
    await this.client.del(key);
  }

  // ──────────────────────────────────────────────
  // Cooldown operations
  // ──────────────────────────────────────────────

  async checkCooldown(email: string): Promise<boolean> {
    const key = this.cooldownKey(email);
    const exists = await this.client.exists(key);
    return exists === 0;
  }

  async getCooldownRemaining(email: string): Promise<number> {
    const key = this.cooldownKey(email);
    const ttl = await this.client.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  async setCooldown(email: string, seconds: number): Promise<void> {
    const key = this.cooldownKey(email);
    await this.client.setEx(key, seconds, "1");
  }

  async clearCooldown(email: string): Promise<void> {
    const key = this.cooldownKey(email);
    await this.client.del(key);
  }

  // ──────────────────────────────────────────────
  // Composite operations
  // ──────────────────────────────────────────────

  async createAndStoreToken(email: string): Promise<string> {
    const token = this.createToken();

    await this.clearToken(email);
    await this.storeHashed(email, token, this.MAGIC_LINK_EXPIRY_SECONDS);

    Logger.debug("Magic link created and stored", {
      email,
      expiresInSeconds: this.MAGIC_LINK_EXPIRY_SECONDS
    });

    return token;
  }

  async setCooldownAfterSend(email: string): Promise<void> {
    await this.setCooldown(email, this.MAGIC_LINK_COOLDOWN_SECONDS);

    Logger.debug("Magic link cooldown set", {
      email,
      cooldownSeconds: this.MAGIC_LINK_COOLDOWN_SECONDS
    });
  }

  async cleanupAll(email: string): Promise<void> {
    await Promise.all([this.clearToken(email), this.clearCooldown(email)]);
  }
}
