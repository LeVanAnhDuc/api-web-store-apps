import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";
import type { createClient } from "redis";
import RedisStore from "rate-limit-redis";
import {
  LOGIN_RATE_LIMITS,
  LOGIN_OTP_RATE_LIMITS,
  MAGIC_LINK_RATE_LIMITS
} from "@/shared/constants/modules/login";
import { SIGNUP_RATE_LIMITS } from "@/shared/constants/modules/signup";
import { TooManyRequestsError } from "@/core/responses/error";

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
        windowMs: LOGIN_RATE_LIMITS.PER_IP.WINDOW_SECONDS * 1000,
        max: LOGIN_RATE_LIMITS.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:login:ip:"),
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
        windowMs: SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.WINDOW_SECONDS * 1000,
        max: SIGNUP_RATE_LIMITS.SEND_OTP.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:signup:ip:"),
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
        windowMs: SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: SIGNUP_RATE_LIMITS.SEND_OTP.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:signup:email:"),
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
        windowMs: SIGNUP_RATE_LIMITS.CHECK_EMAIL.PER_IP.WINDOW_SECONDS * 1000,
        max: SIGNUP_RATE_LIMITS.CHECK_EMAIL.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:check-email:ip:"),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "signup:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent OTP spam from single IP
  get loginOtpByIp(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("login-otp:ip", () =>
      rateLimit({
        windowMs: LOGIN_OTP_RATE_LIMITS.PER_IP.WINDOW_SECONDS * 1000,
        max: LOGIN_OTP_RATE_LIMITS.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:login-otp:ip:"),
        standardHeaders: true,
        legacyHeaders: false,
        handler: this.createRateLimitExceededHandler(
          "login:errors.rateLimitExceeded"
        )
      })
    );
  }

  // Prevent targeted email abuse
  get loginOtpByEmail(): RateLimitRequestHandler {
    return this.getOrCreateLimiter("login-otp:email", () =>
      rateLimit({
        windowMs: LOGIN_OTP_RATE_LIMITS.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: LOGIN_OTP_RATE_LIMITS.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:login-otp:email:"),
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
        windowMs: MAGIC_LINK_RATE_LIMITS.PER_IP.WINDOW_SECONDS * 1000,
        max: MAGIC_LINK_RATE_LIMITS.PER_IP.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:magic-link:ip:"),
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
        windowMs: MAGIC_LINK_RATE_LIMITS.PER_EMAIL.WINDOW_SECONDS * 1000,
        max: MAGIC_LINK_RATE_LIMITS.PER_EMAIL.MAX_REQUESTS,
        store: this.createRedisStore("rate-limit:magic-link:email:"),
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
