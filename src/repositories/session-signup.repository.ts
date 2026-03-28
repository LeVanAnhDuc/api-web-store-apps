import type { RedisClientType } from "redis";
import { buildKey } from "@/utils/common";
import { generateSecureToken } from "@/utils/crypto/otp";
import { SESSION_CONFIG } from "@/constants/config";
import { SIGNUP } from "@/constants/redis/store";

const KEYS = {
  SESSION: SIGNUP.SESSION
};

export type SessionSignupRepository = {
  createToken(): string;
  store(email: string, sessionId: string, expiry: number): Promise<void>;
  verify(email: string, sessionId: string): Promise<boolean>;
  clear(email: string): Promise<void>;
};

export class RedisSessionSignupRepository implements SessionSignupRepository {
  constructor(private readonly client: RedisClientType) {}

  private sessionKey(email: string): string {
    return buildKey(KEYS.SESSION, email);
  }

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
