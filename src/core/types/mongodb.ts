// libs
import type { ConnectOptions } from "mongoose";

/* eslint-disable no-unused-vars */
export enum EConnectionState {
  DISCONNECTED = 0,
  CONNECTED = 1,
  CONNECTING = 2,
  DISCONNECTING = 3
}
/* eslint-enable no-unused-vars */

/**
 * MongoDB configuration interface
 */
export interface IMongoConfig {
  url: string;
  dbName: string;
  options?: ConnectOptions;
}

/**
 * Connection metrics for monitoring
 */
export interface IConnectionMetrics {
  connectionAttempts: number;
  reconnectionAttempts: number;
  lastConnectionTime: Date | null;
  lastDisconnectionTime: Date | null;
  totalDowntime: number;
  uptime?: number;
}

/**
 * Database statistics for health monitoring
 */
export interface IDatabaseStats {
  isHealthy: boolean;
  state: string;
  readyState: number;
  metrics: IConnectionMetrics;
  config: {
    database: string | undefined;
    maxPoolSize: number | undefined;
    minPoolSize: number | undefined;
  };
}
