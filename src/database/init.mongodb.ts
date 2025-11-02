// libs
import mongoose from "mongoose";
// types
import type { ConnectOptions, Connection } from "mongoose";
import type {
  ConnectionStateValue,
  MongoConfig,
  ConnectionMetrics,
  DatabaseStats
} from "@/core/types/mongodb";
// cores
import { Logger } from "@/core/utils/logger";
import config from "@/core/configs/env";
import CONSTANTS from "@/core/constants";

const { CONNECTION_STATE } = CONSTANTS;

class MongoDatabase {
  private static instance: MongoDatabase | null = null;
  private connectionState: ConnectionStateValue = CONNECTION_STATE.DISCONNECTED;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly config: MongoConfig;
  private metrics: ConnectionMetrics = {
    connectionAttempts: 0,
    reconnectionAttempts: 0,
    lastConnectionTime: null,
    lastDisconnectionTime: null,
    totalDowntime: 0
  };

  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly INITIAL_RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private readonly CONNECTION_TIMEOUT = 30000;

  private constructor(config: MongoConfig) {
    this.config = this.validateAndEnhanceConfig(config);
    this.setupProcessHandlers();
    this.setupConnectionEventListeners();
  }

  public static getInstance(): MongoDatabase {
    if (!this.instance) {
      const mongoConfig: MongoConfig = {
        url: config.DB_URL ?? "",
        dbName: config.DB_NAME ?? "",
        options: {}
      };
      this.instance = new MongoDatabase(mongoConfig);
    }
    return this.instance;
  }

  private validateAndEnhanceConfig(config: MongoConfig): MongoConfig {
    if (!config.url?.trim()) {
      throw new Error("MongoDB connection URL is required");
    }

    if (!config.dbName?.trim()) {
      throw new Error("MongoDB database name is required");
    }

    const enhancedOptions: ConnectOptions = {
      maxPoolSize: config.options?.maxPoolSize ?? 10,
      minPoolSize: config.options?.minPoolSize ?? 2,
      maxIdleTimeMS: config.options?.maxIdleTimeMS ?? 30000,
      serverSelectionTimeoutMS:
        config.options?.serverSelectionTimeoutMS ?? 5000,
      socketTimeoutMS: config.options?.socketTimeoutMS ?? 45000,
      compressors: config.options?.compressors ?? ["snappy", "zlib"],
      retryWrites: config.options?.retryWrites ?? true,
      w: config.options?.w ?? "majority",
      ...config.options
    };

    return {
      ...config,
      options: enhancedOptions
    };
  }

  public async connect(): Promise<void> {
    if (this.connectionState === CONNECTION_STATE.CONNECTED) {
      Logger.debug("MongoDB is already connected");
      return;
    }

    if (this.connectionPromise) {
      Logger.debug("MongoDB connection already in progress");
      return this.connectionPromise;
    }

    this.connectionState = CONNECTION_STATE.CONNECTING;
    this.connectionPromise = this.performConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<void> {
    this.metrics.connectionAttempts++;

    try {
      Logger.info("Attempting to connect to MongoDB", {
        dbName: this.config.dbName,
        attempt: this.metrics.connectionAttempts
      });

      await Promise.race([
        mongoose.connect(this.config.url, {
          dbName: this.config.dbName,
          ...this.config.options
        }),
        this.createConnectionTimeout()
      ]);

      this.handleConnectionSuccess();
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }

  private createConnectionTimeout(): Promise<never> {
    return new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `MongoDB connection timeout after ${this.CONNECTION_TIMEOUT}ms`
          )
        );
      }, this.CONNECTION_TIMEOUT);
    });
  }

  private handleConnectionSuccess(): void {
    this.connectionState = CONNECTION_STATE.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    this.reconnectAttempts = 0;

    if (this.metrics.lastDisconnectionTime) {
      const downtime =
        Date.now() - this.metrics.lastDisconnectionTime.getTime();
      this.metrics.totalDowntime += downtime;
      Logger.info(`MongoDB recovered after ${downtime}ms downtime`);
    }

    Logger.info("MongoDB connected successfully", {
      dbName: this.config.dbName,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState
    });
  }

  private async handleConnectionError(error: unknown): Promise<void> {
    this.connectionState = CONNECTION_STATE.DISCONNECTED;

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    Logger.error("MongoDB connection failed", error);

    if (this.metrics.connectionAttempts === 1) {
      throw new Error(`Initial MongoDB connection failed: ${errorMessage}`);
    }

    await this.scheduleReconnection();
  }

  private setupConnectionEventListeners(): void {
    const connection: Connection = mongoose.connection;

    connection.removeAllListeners();

    connection.on("connected", () => this.onConnected());
    connection.on("disconnected", () => this.onDisconnected());
    connection.on("error", (error) => this.onError(error));
    connection.on("reconnected", () => this.onReconnected());

    connection.on("serverHeartbeatSucceeded", () => {
      Logger.debug("MongoDB heartbeat succeeded");
    });

    connection.on("serverHeartbeatFailed", () => {
      Logger.warn("MongoDB heartbeat failed");
    });
  }

  private onConnected(): void {
    this.connectionState = CONNECTION_STATE.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    Logger.info("MongoDB connection established");
  }

  private onDisconnected(): void {
    if (this.connectionState === CONNECTION_STATE.DISCONNECTING) {
      Logger.info("MongoDB disconnected gracefully");
      return;
    }

    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.metrics.lastDisconnectionTime = new Date();
    Logger.warn("MongoDB connection lost unexpectedly");

    this.scheduleReconnection().catch((error) => {
      Logger.error("Failed to schedule reconnection", error);
    });
  }

  private onError(error: Error): void {
    Logger.error("MongoDB error occurred", error);

    if (this.connectionState !== CONNECTION_STATE.CONNECTED) {
      this.scheduleReconnection().catch((err) => {
        Logger.error("Failed to handle reconnection after error", err);
      });
    }
  }

  private onReconnected(): void {
    this.connectionState = CONNECTION_STATE.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    this.metrics.reconnectionAttempts++;
    this.reconnectAttempts = 0;

    Logger.info("MongoDB reconnected successfully", {
      totalReconnections: this.metrics.reconnectionAttempts
    });
  }

  private async scheduleReconnection(): Promise<void> {
    if (this.reconnectTimer) {
      return;
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      const error = new Error("Maximum reconnection attempts exceeded");
      Logger.error(error.message, { attempts: this.reconnectAttempts });
      process.emit("uncaughtException", error);
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY
    );

    Logger.info(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`,
      {
        delayMs: delay
      }
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        Logger.error("Reconnection attempt failed", error);
      }
    }, delay);
  }

  public async disconnect(): Promise<void> {
    if (this.connectionState === CONNECTION_STATE.DISCONNECTED) {
      Logger.debug("MongoDB is already disconnected");
      return;
    }

    this.connectionState = CONNECTION_STATE.DISCONNECTING;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await mongoose.connection.close();
      this.connectionState = CONNECTION_STATE.DISCONNECTED;
      Logger.info("MongoDB disconnected gracefully");
    } catch (error) {
      Logger.error("Error during MongoDB disconnection", error);
      throw error;
    }
  }

  public isHealthy(): boolean {
    return (
      this.connectionState === CONNECTION_STATE.CONNECTED &&
      mongoose.connection.readyState === 1
    );
  }

  public getStats(): DatabaseStats {
    const uptime = this.metrics.lastConnectionTime
      ? Date.now() - this.metrics.lastConnectionTime.getTime()
      : 0;

    return {
      isHealthy: this.isHealthy(),
      state: CONNECTION_STATE[this.connectionState],
      readyState: mongoose.connection.readyState,
      metrics: {
        ...this.metrics,
        uptime
      },
      config: {
        database: this.config.dbName,
        maxPoolSize: this.config.options?.maxPoolSize,
        minPoolSize: this.config.options?.minPoolSize
      }
    };
  }

  private setupProcessHandlers(): void {
    process.once("SIGTERM", async () => {
      Logger.info("SIGTERM received, closing MongoDB connection");
      await this.gracefulShutdown();
    });

    process.once("SIGINT", async () => {
      Logger.info("SIGINT received, closing MongoDB connection");
      await this.gracefulShutdown();
    });

    process.on("uncaughtException", (error) => {
      Logger.error("Uncaught exception, closing MongoDB connection", error);
      void this.gracefulShutdown().finally(() => {
        process.exit(1);
      });
    });

    process.on("unhandledRejection", (reason, promise) => {
      Logger.error("Unhandled rejection at promise", { reason, promise });
    });
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await this.disconnect();
    } catch (error) {
      Logger.error("Error during graceful shutdown", error);
    } finally {
      process.exit(0);
    }
  }

  public static async resetInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}

export default MongoDatabase;
