import instanceMongoDB from "@/database/mongodb";
import { Logger } from "@/infra/utils/logger";
import { seedUsers, clearUsers } from "./user.seeder";

const runSeeders = async (): Promise<void> => {
  try {
    Logger.info("Connecting to MongoDB...");
    await instanceMongoDB.connect();

    const args = process.argv.slice(2);
    const shouldClear = args.includes("--clear");

    if (shouldClear) {
      Logger.info("Clear flag detected, removing existing test data...");
      await clearUsers();
    }

    Logger.info("Running seeders...");
    await seedUsers();

    Logger.info("All seeders completed successfully!");
  } catch (error) {
    Logger.error("Seeder failed", error);
    process.exit(1);
  } finally {
    await instanceMongoDB.disconnect();
    process.exit(0);
  }
};

runSeeders();
