import { ConnectionTimeoutError } from "redis";
import type { createClient } from "redis";
import { Logger } from "@/infra/utils/logger";

export const REDIS_STATUS = {
  CONNECT: "connect",
  END: "end",
  RECONNECT: "reconnecting",
  ERROR: "error"
} as const;

export const setupEventHandlers = (
  client: ReturnType<typeof createClient>
): void => {
  client.on(REDIS_STATUS.CONNECT, () => {
    Logger.info("Redis connection established");
  });

  client.on(REDIS_STATUS.END, () => {
    Logger.warn("Redis connection ended");
  });

  client.on(REDIS_STATUS.RECONNECT, () => {
    Logger.info("Redis reconnecting...");
  });

  client.on(REDIS_STATUS.ERROR, (error) => {
    if (error instanceof ConnectionTimeoutError) {
      Logger.error("Redis connection timeout", {
        error: error.message
      });
      // Gửi metric
      // metrics.increment('redis.connection.timeout');
    } else {
      Logger.error("Redis connection error", error);
    }
  });
};
