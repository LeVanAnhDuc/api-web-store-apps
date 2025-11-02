// libs
import "reflect-metadata";
import app from "./app";
// databases
import MongoDatabase from "./database/init.mongodb";
// import instanceRedis from './database/init.redis';
// cores
import { Logger } from "./core/utils/logger";
import config from "./core/configs/env";

// Server instance
let server: ReturnType<typeof app.listen> | undefined;

/**
 * Start server with database connections
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize MongoDB
    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.connect();
    Logger.info("MongoDB initialized successfully");

    // Initialize Redis (if needed)
    // await instanceRedis.connect();
    // Logger.info("Redis initialized successfully");

    // Start Express server
    const PORT = config.APP_PORT || 3000;
    server = app.listen(PORT, () => {
      Logger.info(`Server is running at http://localhost:${PORT}`);
      Logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle server errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof PORT === "string" ? `Pipe ${PORT}` : `Port ${PORT}`;

      switch (error.code) {
        case "EACCES":
          Logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          Logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    Logger.error("Failed to start server", error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  Logger.info(`${signal} received, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          Logger.info("HTTP server closed");
          resolve();
        });
      });
    }

    // Close database connections
    const mongoDb = MongoDatabase.getInstance();
    await mongoDb.disconnect();
    Logger.info("Database connections closed");

    // Close Redis connection
    // await instanceRedis.disconnect();

    Logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    Logger.error("Error during graceful shutdown", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Rejection", { reason, promise });
  gracefulShutdown("unhandledRejection");
});

// Start the server
startServer().catch((error) => {
  Logger.error("Fatal error during startup", error);
  process.exit(1);
});
