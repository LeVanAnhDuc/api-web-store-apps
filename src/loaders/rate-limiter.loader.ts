import instanceRedis from "@/database/redis";
import { RateLimiterMiddleware } from "@/shared/middlewares/rate-limiter.middleware";
import { Logger } from "@/core/utils/logger";

// Using `let` because instance is created at runtime after Redis connects
let rateLimiterMiddleware: RateLimiterMiddleware;

export const loadRateLimiters = (): void => {
  try {
    const redisClient = instanceRedis.getClient();
    rateLimiterMiddleware = new RateLimiterMiddleware(redisClient);
    Logger.info("Rate limiters initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize rate limiters", error);
    throw error;
  }
};

export const getRateLimiterMiddleware = (): RateLimiterMiddleware => {
  if (!rateLimiterMiddleware) {
    throw new Error(
      "RateLimiterMiddleware not initialized. Call loadRateLimiters() first."
    );
  }

  return rateLimiterMiddleware;
};

export { rateLimiterMiddleware };
