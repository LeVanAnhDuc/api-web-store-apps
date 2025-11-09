// libs
import type { Connection } from "mongoose";
// types
import type { ConnectionStateValue } from "@/shared/types/databases/mongodb";
// utils
import { Logger } from "@/core/utils/logger";
// constants
import CONSTANTS from "@/shared/constants";

const { CONNECTION_STATE } = CONSTANTS.DATABASE;

interface EventHandlers {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: () => void;
  onReconnected: () => void;
}

export const setupEventHandlers = (
  connection: Connection,
  handlers: EventHandlers
): void => {
  connection.removeAllListeners();

  connection.on("connected", () => {
    Logger.info("MongoDB connection established");
    handlers.onConnected();
  });

  connection.on("disconnected", () => {
    Logger.warn("MongoDB connection lost unexpectedly");
    handlers.onDisconnected();
  });

  connection.on("error", (error: Error) => {
    Logger.error("MongoDB error occurred", error);
    handlers.onError();
  });

  connection.on("reconnected", () => {
    Logger.info("MongoDB reconnected successfully");
    handlers.onReconnected();
  });

  connection.on("serverHeartbeatSucceeded", () => {
    Logger.debug("MongoDB heartbeat succeeded");
  });

  connection.on("serverHeartbeatFailed", () => {
    Logger.warn("MongoDB heartbeat failed");
  });
};

export const updateConnectionState = (
  currentState: ConnectionStateValue,
  newState: ConnectionStateValue
): ConnectionStateValue => {
  if (currentState !== newState) {
    Logger.debug(
      `MongoDB state changed: ${CONNECTION_STATE[currentState]} → ${CONNECTION_STATE[newState]}`
    );
  }
  return newState;
};
