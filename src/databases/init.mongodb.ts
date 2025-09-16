// libs
import mongoose from "mongoose";
// others
import config from "../constants/env";
import { MongoError } from "../responses/error.response";

enum statusConnectMongo {
  OPEN = "open",
  CONNECT = "connected",
  DISCONNECT = "disconnected",
  RECONNECT = "reconnected",
  ERROR = "error",
  CLOSE = "close"
}

const MONGO_CONNECT_TIMEOUT = 10000;
const MONGO_CONNECT_MESSAGE = {
  code: -99,
  message: {
    en: "service connect mongo error"
  }
};

class MongoDatabase {
  private static instance: MongoDatabase | null = null;
  private connectionTimeout;

  constructor() {
    this.connectionTimeout = null;
    this.connect();
  }

  public static getInstance(): MongoDatabase {
    if (!this.instance) this.instance = new MongoDatabase();

    return this.instance;
  }

  public connect = async () => {
    if (config.DB_URL && config.DB_NAME) {
      this.handleEventConnect();
      await mongoose.connect(config.DB_URL, {
        dbName: config.DB_NAME
      });
    }
  };

  private handleEventConnect = () => {
    mongoose.connection.on(statusConnectMongo.CONNECT, () => {
      console.log("connected mongo: connected");
      clearTimeout(this.connectionTimeout);
    });
    mongoose.connection.on(statusConnectMongo.OPEN, () => {
      console.log("connected mongo: open");
      clearTimeout(this.connectionTimeout);
    });
    mongoose.connection.on(statusConnectMongo.DISCONNECT, () => {
      console.log("connected mongo: disconnect");
      this.handleTimeoutError();
    });
    mongoose.connection.on(statusConnectMongo.RECONNECT, () => {
      console.log("connected mongo: reconnecting");
      clearTimeout(this.connectionTimeout);
    });
    mongoose.connection.on(statusConnectMongo.ERROR, (error) => {
      console.log(`connected mongo: ${error}`);
      this.handleTimeoutError();
    });
    mongoose.connection.on(statusConnectMongo.CLOSE, () => {
      console.log("connected mongo: close");
      clearTimeout(this.connectionTimeout);
    });
  };

  private handleTimeoutError = () => {
    this.connectionTimeout = setTimeout(() => {
      throw new MongoError(
        MONGO_CONNECT_MESSAGE.message.en,
        MONGO_CONNECT_MESSAGE.code
      );
    }, MONGO_CONNECT_TIMEOUT);
  };
}

export default MongoDatabase;
