// libs
import mongoose from "mongoose";
// types
import type {
  ConnectionStateValue,
  ConnectionMetrics,
  DatabaseStats,
  MongoConfig
} from "@/types/mongodb";
// constants
import CONSTANTS from "@/core/constants";

const { CONNECTION_STATE } = CONSTANTS;

export const isHealthy = (state: ConnectionStateValue): boolean =>
  state === CONNECTION_STATE.CONNECTED && mongoose.connection.readyState === 1;

export const getStats = (
  state: ConnectionStateValue,
  metrics: ConnectionMetrics,
  config: MongoConfig
): DatabaseStats => {
  const uptime = metrics.lastConnectionTime
    ? Date.now() - metrics.lastConnectionTime.getTime()
    : 0;

  return {
    isHealthy: isHealthy(state),
    state: CONNECTION_STATE[state],
    readyState: mongoose.connection.readyState,
    metrics: {
      ...metrics,
      uptime
    },
    config: {
      database: config.dbName,
      maxPoolSize: config.options?.maxPoolSize,
      minPoolSize: config.options?.minPoolSize
    }
  };
};
