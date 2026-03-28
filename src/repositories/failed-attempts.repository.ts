import type { RedisClientType } from "redis";
import { buildKey } from "@/utils/common";
import { LOGIN_LOCKOUT } from "@/constants/config";
import { LOGIN } from "@/constants/redis/store";

const KEYS = {
  FAILED_ATTEMPTS: LOGIN.FAILED_ATTEMPTS,
  LOCKOUT: LOGIN.LOCKOUT
};

export type FailedAttemptsRepository = {
  readonly MAX_REQUESTS_PER_HOUR?: number;
  getCount(email: string): Promise<number>;
  trackAttempt(
    email: string
  ): Promise<{ attemptCount: number; lockoutSeconds: number }>;
  resetAll(email: string): Promise<void>;
  checkLockout(
    email: string
  ): Promise<{ isLocked: boolean; remainingSeconds: number }>;
};

export class RedisFailedAttemptsRepository implements FailedAttemptsRepository {
  constructor(private readonly client: RedisClientType) {}

  private failedAttemptsKey(email: string): string {
    return buildKey(KEYS.FAILED_ATTEMPTS, email);
  }

  private lockoutKey(email: string): string {
    return buildKey(KEYS.LOCKOUT, email);
  }

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
