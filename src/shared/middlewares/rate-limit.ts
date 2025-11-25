import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import instanceRedis from "@/database/redis/redis.database";
import { LOGIN_RATE_LIMITS } from "@/shared/constants/modules/login";
import { TooManyRequestsError } from "@/core/responses/error";

let loginRateLimiter: RateLimitRequestHandler | null = null;

export const getLoginRateLimiter = (): RateLimitRequestHandler => {
  if (loginRateLimiter === null) {
    loginRateLimiter = rateLimit({
      windowMs: LOGIN_RATE_LIMITS.PER_IP.WINDOW_SECONDS * 1000, // 15 minutes
      max: LOGIN_RATE_LIMITS.PER_IP.MAX_REQUESTS, // 30 requests per window

      store: new RedisStore({
        sendCommand: (...args: string[]) =>
          instanceRedis.getClient().sendCommand(args),
        prefix: "rate-limit:login:ip:"
      }),

      // Standard rate limit headers
      standardHeaders: true, // Return `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers

      // Custom handler for rate limit exceeded
      handler: (req, res) => {
        const { t } = req;
        const error = new TooManyRequestsError(
          t("login:errors.rateLimitExceeded")
        );

        res.status(error.status).json({
          timestamp: new Date().toISOString(),
          route: req.originalUrl,
          message: error.message,
          error: error.error
        });
      }

      // keyGenerator: (req) => req.ip || "unknown"
    });
  }

  return loginRateLimiter;
};
