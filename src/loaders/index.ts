// types
import type { Express } from "express";
// others
import { loadDatabase, closeDatabase } from "./database.loader";
import { loadRedis, closeRedis } from "./redis.loader";
import { loadServices } from "./services.loader";
import { loadQueues, closeAllQueues } from "./queue.loader";
import { loadModules } from "./modules.loader";
import { loadErrorHandlers } from "./error-handler.loader";
import { Logger } from "@/utils/logger";

export const loadAll = async (app: Express): Promise<void> => {
  try {
    await loadDatabase();
    await loadRedis();

    const services = loadServices();
    loadQueues(app, services);
    loadModules(app, services);

    loadErrorHandlers(app);

    Logger.info("All loaders initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize loaders", error);
    throw error;
  }
};

export const closeAll = async (): Promise<void> => {
  try {
    await closeAllQueues();
    await closeDatabase();
    await closeRedis();
    Logger.info("All connections closed successfully");
  } catch (error) {
    Logger.error("Failed to close all connections", error);
    throw error;
  }
};
