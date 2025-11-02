/**
 * MongoDB Connection Manager
 * Handles database connections with proper error handling, retry logic, and monitoring
 * Following Senior-level best practices and modern TypeScript patterns
 * @author Senior Backend Engineer
 * @version 3.0.0
 */

// External dependencies
import mongoose from "mongoose";
import type { ConnectOptions, Connection } from "mongoose";

// Internal dependencies - Types
import type {
  IMongoConfig,
  IConnectionMetrics,
  IDatabaseStats
} from "@/core/types/mongodb";
import { EConnectionState } from "@/core/types/mongodb";

// Internal dependencies - Libraries
import { Logger } from "@/core/utils/logger";

// Internal dependencies - Constants
import config from "@/core/configs/env";

/**
 * MongoDB Database Connection Manager
 * Implements Singleton pattern for single connection instance
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection pooling optimization
 * - Health monitoring and metrics
 * - Graceful shutdown handling
 */
class MongoDatabase {
  private static instance: MongoDatabase | null = null;
  private connectionState = EConnectionState.DISCONNECTED;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly config: IMongoConfig;

  // Connection metrics for monitoring
  private metrics: IConnectionMetrics = {
    connectionAttempts: 0,
    reconnectionAttempts: 0,
    lastConnectionTime: null,
    lastDisconnectionTime: null,
    totalDowntime: 0
  };

  // Configuration constants
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly INITIAL_RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private readonly CONNECTION_TIMEOUT = 30000;

  /**
   * Private constructor for Singleton pattern
   * @param config MongoDB configuration
   */
  private constructor(config: IMongoConfig) {
    this.config = this.validateAndEnhanceConfig(config);
    this.setupProcessHandlers();
    this.setupConnectionEventListeners();
  }

  /**
   * Get singleton instance of MongoDatabase
   * @returns MongoDatabase instance
   */
  public static getInstance(): MongoDatabase {
    if (!this.instance) {
      const mongoConfig: IMongoConfig = {
        url: config.DB_URL ?? "",
        dbName: config.DB_NAME ?? "",
        options: {}
      };
      this.instance = new MongoDatabase(mongoConfig);
    }
    return this.instance;
  }

  /**
   * Validate and enhance configuration with production-ready options
   * @param config Raw configuration
   * @returns Enhanced configuration
   */
  private validateAndEnhanceConfig(config: IMongoConfig): IMongoConfig {
    // Validate required fields
    if (!config.url?.trim()) {
      throw new Error("MongoDB connection URL is required");
    }

    if (!config.dbName?.trim()) {
      throw new Error("MongoDB database name is required");
    }

    // Enhanced connection options for production
    const enhancedOptions: ConnectOptions = {
      // Connection pool settings
      maxPoolSize: config.options?.maxPoolSize ?? 10,
      minPoolSize: config.options?.minPoolSize ?? 2,
      maxIdleTimeMS: config.options?.maxIdleTimeMS ?? 30000,

      // Timeout settings
      serverSelectionTimeoutMS:
        config.options?.serverSelectionTimeoutMS ?? 5000,
      socketTimeoutMS: config.options?.socketTimeoutMS ?? 45000,

      // Performance optimizations
      compressors: config.options?.compressors ?? ["snappy", "zlib"],
      retryWrites: config.options?.retryWrites ?? true,
      w: config.options?.w ?? "majority",

      // Merge with provided options
      ...config.options
    };

    return {
      ...config,
      options: enhancedOptions
    };
  }

  /**
   * Connect to MongoDB with proper error handling
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    // Guard clause - already connected
    if (this.connectionState === EConnectionState.CONNECTED) {
      Logger.debug("MongoDB is already connected");
      return;
    }

    // Guard clause - connection in progress
    if (this.connectionPromise) {
      Logger.debug("MongoDB connection already in progress");
      return this.connectionPromise;
    }

    this.connectionState = EConnectionState.CONNECTING;
    this.connectionPromise = this.performConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Perform actual connection to MongoDB
   * @returns Promise that resolves when connected
   */
  private async performConnection(): Promise<void> {
    this.metrics.connectionAttempts++;

    try {
      Logger.info("Attempting to connect to MongoDB", {
        dbName: this.config.dbName,
        attempt: this.metrics.connectionAttempts
      });

      // Create connection with timeout
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

  /**
   * Create timeout promise for connection attempts
   * @returns Promise that rejects after timeout
   */
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

  /**
   * Handle successful connection
   */
  private handleConnectionSuccess(): void {
    this.connectionState = EConnectionState.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    this.reconnectAttempts = 0;

    // Calculate downtime if previously disconnected
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

  /**
   * Handle connection error
   * @param error Connection error
   */
  private async handleConnectionError(error: unknown): Promise<void> {
    this.connectionState = EConnectionState.DISCONNECTED;

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    Logger.error("MongoDB connection failed", error);

    // Don't auto-reconnect on initial connection failure
    if (this.metrics.connectionAttempts === 1) {
      throw new Error(`Initial MongoDB connection failed: ${errorMessage}`);
    }

    // Attempt reconnection for subsequent failures
    await this.scheduleReconnection();
  }

  /**
   * Setup MongoDB event listeners
   */
  private setupConnectionEventListeners(): void {
    const connection: Connection = mongoose.connection;

    // Remove existing listeners to prevent duplicates
    connection.removeAllListeners();

    // Connection events
    connection.on("connected", () => this.onConnected());
    connection.on("disconnected", () => this.onDisconnected());
    connection.on("error", (error) => this.onError(error));
    connection.on("reconnected", () => this.onReconnected());

    // Monitoring events
    connection.on("serverHeartbeatSucceeded", () => {
      Logger.debug("MongoDB heartbeat succeeded");
    });

    connection.on("serverHeartbeatFailed", () => {
      Logger.warn("MongoDB heartbeat failed");
    });
  }

  /**
   * Handle connected event
   */
  private onConnected(): void {
    this.connectionState = EConnectionState.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    Logger.info("MongoDB connection established");
  }

  /**
   * Handle disconnected event
   */
  private onDisconnected(): void {
    // Skip if intentional disconnection
    if (this.connectionState === EConnectionState.DISCONNECTING) {
      Logger.info("MongoDB disconnected gracefully");
      return;
    }

    this.connectionState = EConnectionState.DISCONNECTED;
    this.metrics.lastDisconnectionTime = new Date();
    Logger.warn("MongoDB connection lost unexpectedly");

    // Schedule reconnection
    this.scheduleReconnection().catch((error) => {
      Logger.error("Failed to schedule reconnection", error);
    });
  }

  /**
   * Handle connection error event
   * @param error MongoDB error
   */
  private onError(error: Error): void {
    Logger.error("MongoDB error occurred", error);

    // Attempt reconnection if not connected
    if (this.connectionState !== EConnectionState.CONNECTED) {
      this.scheduleReconnection().catch((err) => {
        Logger.error("Failed to handle reconnection after error", err);
      });
    }
  }

  /**
   * Handle successful reconnection
   */
  private onReconnected(): void {
    this.connectionState = EConnectionState.CONNECTED;
    this.metrics.lastConnectionTime = new Date();
    this.metrics.reconnectionAttempts++;
    this.reconnectAttempts = 0;

    Logger.info("MongoDB reconnected successfully", {
      totalReconnections: this.metrics.reconnectionAttempts
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   * @returns Promise that resolves when reconnection is scheduled
   */
  private async scheduleReconnection(): Promise<void> {
    // Guard clause - already scheduled
    if (this.reconnectTimer) {
      return;
    }

    // Guard clause - max attempts reached
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      const error = new Error("Maximum reconnection attempts exceeded");
      Logger.error(error.message, { attempts: this.reconnectAttempts });

      // Emit fatal error for monitoring systems
      process.emit("uncaughtException", error);
      return;
    }

    this.reconnectAttempts++;

    // Calculate exponential backoff delay
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

  /**
   * Gracefully disconnect from MongoDB
   * @returns Promise that resolves when disconnected
   */
  public async disconnect(): Promise<void> {
    // Guard clause - already disconnected
    if (this.connectionState === EConnectionState.DISCONNECTED) {
      Logger.debug("MongoDB is already disconnected");
      return;
    }

    this.connectionState = EConnectionState.DISCONNECTING;

    // Clear any pending reconnection
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await mongoose.connection.close();
      this.connectionState = EConnectionState.DISCONNECTED;
      Logger.info("MongoDB disconnected gracefully");
    } catch (error) {
      Logger.error("Error during MongoDB disconnection", error);
      throw error;
    }
  }

  /**
   * Check if database connection is healthy
   * @returns true if healthy, false otherwise
   */
  public isHealthy(): boolean {
    return (
      this.connectionState === EConnectionState.CONNECTED &&
      mongoose.connection.readyState === 1
    );
  }

  /**
   * Get connection statistics for monitoring
   * @returns Database statistics
   */
  public getStats(): IDatabaseStats {
    const uptime = this.metrics.lastConnectionTime
      ? Date.now() - this.metrics.lastConnectionTime.getTime()
      : 0;

    return {
      isHealthy: this.isHealthy(),
      state: EConnectionState[this.connectionState],
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

  /**
   * Setup process event handlers for graceful shutdown
   */
  private setupProcessHandlers(): void {
    // Graceful shutdown on SIGTERM
    process.once("SIGTERM", async () => {
      Logger.info("SIGTERM received, closing MongoDB connection");
      await this.gracefulShutdown();
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.once("SIGINT", async () => {
      Logger.info("SIGINT received, closing MongoDB connection");
      await this.gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      Logger.error("Uncaught exception, closing MongoDB connection", error);
      void this.gracefulShutdown().finally(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      Logger.error("Unhandled rejection at promise", { reason, promise });
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    try {
      await this.disconnect();
    } catch (error) {
      Logger.error("Error during graceful shutdown", error);
    } finally {
      process.exit(0);
    }
  }

  /**
   * Reset instance (for testing purposes)
   */
  public static async resetInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}

export default MongoDatabase;
