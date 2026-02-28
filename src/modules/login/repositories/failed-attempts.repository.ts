import type { RedisClientType } from "redis";
import RedisCache from "@/services/implements/RedisCache";
import { REDIS_KEYS } from "@/constants/infrastructure";
import { LOGIN_LOCKOUT } from "@/constants/config";

const KEYS = {
  FAILED_ATTEMPTS: REDIS_KEYS.LOGIN.FAILED_ATTEMPTS,
  LOCKOUT: REDIS_KEYS.LOGIN.LOCKOUT
};

export class FailedAttemptsRepository extends RedisCache {
  constructor(client: RedisClientType) {
    super(client, "FailedAttemptsRepository", {
      cacheEnabled: true,
      keyPrefix: ""
    });
  }

  // ──────────────────────────────────────────────
  // Key builders
  // ──────────────────────────────────────────────

  private failedAttemptsKey(email: string): string {
    return this.buildKey(KEYS.FAILED_ATTEMPTS, email);
  }

  private lockoutKey(email: string): string {
    return this.buildKey(KEYS.LOCKOUT, email);
  }

  // ──────────────────────────────────────────────
  // Operations
  // ──────────────────────────────────────────────

  async getCount(email: string): Promise<number> {
    const key = this.failedAttemptsKey(email);
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async trackAttempt(
    email: string
  ): Promise<{ attemptCount: number; lockoutSeconds: number }> {
    const attemptsKey = this.failedAttemptsKey(email);
    const lockoutKey = this.lockoutKey(email);

    const attemptCount = await this.client.incr(attemptsKey);

    if (attemptCount === 1) {
      await this.client.expire(attemptsKey, LOGIN_LOCKOUT.RESET_WINDOW_SECONDS);
    }

    const lockoutSeconds = this.calculateLockoutDuration(attemptCount);

    if (lockoutSeconds > 0) {
      await this.client.setEx(
        lockoutKey,
        lockoutSeconds,
        attemptCount.toString()
      );
    }

    return { attemptCount, lockoutSeconds };
  }

  async resetAll(email: string): Promise<void> {
    await Promise.all([
      this.client.del(this.failedAttemptsKey(email)),
      this.client.del(this.lockoutKey(email))
    ]);
  }

  async checkLockout(
    email: string
  ): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    const key = this.lockoutKey(email);
    const ttl = await this.client.ttl(key);

    if (ttl > 0) {
      return { isLocked: true, remainingSeconds: ttl };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private calculateLockoutDuration(attemptCount: number): number {
    const { LOCKOUT_DURATIONS, MAX_LOCKOUT_SECONDS } = LOGIN_LOCKOUT;

    if (attemptCount >= 10) {
      return MAX_LOCKOUT_SECONDS;
    }

    return (
      LOCKOUT_DURATIONS[attemptCount as keyof typeof LOCKOUT_DURATIONS] || 0
    );
  }
}
