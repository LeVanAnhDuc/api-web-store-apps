import MongoDatabase from "../database/init.mongodb";
import { Logger } from "../core/utils/logger";

export const loadDatabase = async (): Promise<void> => {
  try {
    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.connect();
    Logger.info("MongoDB initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize MongoDB", error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.disconnect();
    Logger.info("MongoDB connections closed");
  } catch (error) {
    Logger.error("Failed to close MongoDB connections", error);
    throw error;
  }
};
