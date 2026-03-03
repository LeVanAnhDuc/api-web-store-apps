import type { Express } from "express";
import { loadDatabase, closeDatabase } from "./database.loader";
import { loadRedis, closeRedis } from "./redis.loader";
import { loadModules } from "./modules.loader";
import { loadErrorHandlers } from "./error-handler.loader";
import { Logger } from "@/utils/logger";

export const loadAll = async (app: Express): Promise<void> => {
  try {
    await loadDatabase();
    await loadRedis();

    // Modules (including rate limiters) use Redis - must initialize after Redis connects
    loadModules(app);

    // Error handlers must be registered AFTER all routes
    loadErrorHandlers(app);

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
