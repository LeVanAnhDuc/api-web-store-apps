// types
import type { ConnectOptions } from "mongoose";
import type DATABASE_CONSTANTS from "@/shared/constants/database";

export type ConnectionStateValue =
  (typeof DATABASE_CONSTANTS)["CONNECTION_STATE"][keyof (typeof DATABASE_CONSTANTS)["CONNECTION_STATE"]];

export interface MongoConfig {
  url: string;
  dbName: string;
  options?: ConnectOptions;
}

export interface ConnectionMetrics {
  connectionAttempts: number;
  reconnectionAttempts: number;
  lastConnectionTime: Date | null;
  lastDisconnectionTime: Date | null;
  totalDowntime: number;
  uptime?: number;
}

export interface DatabaseStats {
  isHealthy: boolean;
  state: string;
  readyState: number;
  metrics: ConnectionMetrics;
  config: {
    database: string | undefined;
    maxPoolSize: number | undefined;
    minPoolSize: number | undefined;
  };
}
