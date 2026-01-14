import { loadDatabase, closeDatabase } from "./database.loader";
import { loadRedis, closeRedis } from "./redis.loader";
import { loadRateLimiters } from "./rate-limiter.loader";
import { Logger } from "@/infra/utils/logger";

export const loadAll = async (): Promise<void> => {
  try {
    await loadDatabase();
    await loadRedis();

    // Rate limiters use RedisStore - must initialize after Redis connects
    loadRateLimiters();

    Logger.info("All loaders initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize loaders", error);
    throw error;
  }
};

export const closeAll = async (): Promise<void> => {
  try {
    await closeDatabase();
    await closeRedis();
    Logger.info("All connections closed successfully");
  } catch (error) {
    Logger.error("Failed to close all connections", error);
    throw error;
  }
};
