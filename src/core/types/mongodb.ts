// libs
import type { ConnectOptions } from "mongoose";

export enum EConnectionState {
  // eslint-disable-next-line no-unused-vars
  DISCONNECTED = 0,
  // eslint-disable-next-line no-unused-vars
  CONNECTED = 1,
  // eslint-disable-next-line no-unused-vars
  CONNECTING = 2,
  // eslint-disable-next-line no-unused-vars
  DISCONNECTING = 3
}

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
