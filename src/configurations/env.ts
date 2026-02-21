import * as dotenv from "dotenv";

dotenv.config();

const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_PORT: process.env.APP_PORT,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  ALLOW_CROSS_ORIGIN_COOKIES: process.env.ALLOW_CROSS_ORIGIN_COOKIES,

  DB_URL: process.env.DB_URL,
  DB_NAME: process.env.DB_NAME,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ID_SECRET: process.env.JWT_ID_SECRET,

  USERNAME_EMAIL: process.env.USERNAME_EMAIL,
  PASSWORD_EMAIL: process.env.PASSWORD_EMAIL
};

export default ENV;
