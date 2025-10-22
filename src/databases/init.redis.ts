import { createClient } from "redis";
import config from "../constants/env";
import { RedisError } from "../responses/error.response";

const statusConnectRedis = {
  CONNECT: "connect",
  END: "end",
  RECONNECT: "reconnecting",
  ERROR: "error"
};

const REDIS_CONNECT_TIMEOUT = 10000;
const REDIS_CONNECT_MESSAGE = {
  code: -99,
  message: {
    vn: "redis bị lỗi",
    en: "service connect redis error"
  }
};

// Singleton pattern
class RedisDatabase {
  private static instance: RedisDatabase | null = null;
  private connectionTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public client: Record<string, any>;

  constructor() {
    this.connectionTimeout = null;
    this.connectRedis();
  }

  public static getInstance(): RedisDatabase {
    if (this.instance === null) {
      this.instance = new RedisDatabase();
    }
    return this.instance;
  }

  public connectRedis = async () => {
    if (config.REDIS_URL) {
      const redisClient = createClient({ url: config.REDIS_URL });
      redisClient.connect();
      this.handleEventConnect(redisClient);
      this.client = redisClient;
    }
  };

  public getRedis = () => {
    if (!this.client) {
      throw new RedisError(
        REDIS_CONNECT_MESSAGE.message.en,
        REDIS_CONNECT_MESSAGE.code
      );
    }
    return this.client;
  };

  public closeRedis = () => {
    if (this.client) {
      this.client.quit();
      this.handleEventConnect(this.client);
      this.client = null;
    } else {
      throw new RedisError(
        REDIS_CONNECT_MESSAGE.message.en,
        REDIS_CONNECT_MESSAGE.code
      );
    }
  };

  private handleEventConnect = (redisClient) => {
    redisClient.on(statusConnectRedis.CONNECT, () => {
      console.log("connected redis: connected");
      clearTimeout(this.connectionTimeout);
    });

    redisClient.on(statusConnectRedis.END, () => {
      console.log("connected redis: end");
      this.handleTimeoutError();
    });

    redisClient.on(statusConnectRedis.RECONNECT, () => {
      console.log("connected redis: reconnecting");
      clearTimeout(this.connectionTimeout);
    });

    redisClient.on(statusConnectRedis.ERROR, (error) => {
      console.log(`connected redis: ${error}`);
      this.handleTimeoutError();
    });
  };

  private handleTimeoutError = () => {
    this.connectionTimeout = setTimeout(() => {
      throw new RedisError(
        REDIS_CONNECT_MESSAGE.message.en,
        REDIS_CONNECT_MESSAGE.code
      );
    }, REDIS_CONNECT_TIMEOUT);
  };
}

const instanceRedis = RedisDatabase.getInstance();

export default instanceRedis;
