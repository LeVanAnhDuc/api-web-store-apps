import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { generateSecureToken } from "@/utils/crypto/otp";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { SESSION_CONFIG } from "@/constants/config";

const KEYS = {
  SESSION: REDIS_KEYS.SIGNUP.SESSION
};

export class SessionSignupRepository extends RedisCache {
  constructor(client: RedisClientType) {
    super(client, "SessionSignupRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private sessionKey(email: string): string {
    return this.buildKey(KEYS.SESSION, email);
  }

  // ──────────────────────────────────────────────
  // Operations
  // ──────────────────────────────────────────────

  createToken(): string {
    return generateSecureToken(SESSION_CONFIG.TOKEN_LENGTH);
  }

  async store(email: string, sessionId: string, expiry: number): Promise<void> {
    const key = this.sessionKey(email);
    await this.client.setEx(key, expiry, sessionId);
  }

  async verify(email: string, sessionId: string): Promise<boolean> {
    const key = this.sessionKey(email);
    const storedSessionId = await this.client.get(key);
    return storedSessionId === sessionId;
  }

  async clear(email: string): Promise<void> {
    const key = this.sessionKey(email);
    await this.client.del(key);
  }
}
