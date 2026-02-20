import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";
import type { createClient } from "redis";
import RedisStore from "rate-limit-redis";
import { TooManyRequestsError } from "@/infra/responses/error";
import { REDIS_KEYS } from "@/constants/redis";
import { RATE_LIMIT_CONFIG } from "../constants";

type RedisClient = ReturnType<typeof createClient>;
type RateLimitHandler = (req: Request, res: Response) => void;

export class RateLimiterMiddleware {
  private readonly redisClient: RedisClient;
  private readonly limiters: Map<string, RateLimitRequestHandler> = new Map();

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  private createRedisStore(prefix: string): RedisStore {
    return new RedisStore({
      sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
      prefix
    });
  }

  private createRateLimitExceededHandler(
    messageKey: I18n.Key
  ): RateLimitHandler {
    return (req: Request, res: Response): void => {
      const { t } = req;
      const error = new TooManyRequestsError(t(messageKey));

      res.status(error.status).json({
        timestamp: new Date().toISOString(),
        route: req.originalUrl,
        message: error.message,
        error: error.error
      });
    };
  }

  // Singleton pattern - create limiter once, reuse on subsequent calls
  private getOrCreateLimiter(
    key: string,
    factory: () => RateLimitRequestHandler
  ): RateLimitRequestHandler {
    if (!this.limiters.has(key)) {
      this.limiters.set(key, factory());
    }

    return this.limiters.get(key)!;
  }

  // Prevent brute force attacks from single IP
  get loginByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("login:ip", () =>
      rateLimit({
        windowMs: RATE_LIMIT_CONFIG.LOGIN.PASSWORD.PER_IP.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.LOGIN.PASSWORD.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN.IP),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent distributed OTP spam attacks
  get signupOtpByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("signup:ip", () =>
      rateLimit({
        windowMs:
          RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_IP.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.SIGNUP.IP),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "signup:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent email inbox spam
  get signupOtpByEmail(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("signup:email", () =>
      rateLimit({
        windowMs:
          RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.SIGNUP.SEND_OTP.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.SIGNUP.EMAIL),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
        handler: this.createRateLimitExceededHandler(
          "signup:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent email enumeration attacks
  get checkEmailByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("check-email:ip", () =>
      rateLimit({
        windowMs:
          RATE_LIMIT_CONFIG.SIGNUP.CHECK_EMAIL.PER_IP.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.SIGNUP.CHECK_EMAIL.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.CHECK_EMAIL.IP),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "signup:errors.rateLimitExceeded"
        )
      })
    );
  }

  get loginOtpByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("login-otp:ip", () =>
      rateLimit({
        windowMs: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_IP.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN_OTP.IP),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }

  get loginOtpByEmail(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("login-otp:email", () =>
      rateLimit({
        windowMs: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.LOGIN.OTP.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.LOGIN_OTP.EMAIL),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent magic link spam from single IP
  get magicLinkByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("magic-link:ip", () =>
      rateLimit({
        windowMs:
          RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_IP.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.MAGIC_LINK.IP),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent targeted email abuse via magic links
  get magicLinkByEmail(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("magic-link:email", () =>
      rateLimit({
        windowMs:
          RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: RATE_LIMIT_CONFIG.LOGIN.MAGIC_LINK.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore(REDIS_KEYS.RATE_LIMIT.MAGIC_LINK.EMAIL),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.body.email?.toLowerCase() || "unknown",
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }
}
