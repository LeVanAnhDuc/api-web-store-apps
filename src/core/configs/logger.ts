// libs
import { format, addColors, createLogger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const COLORS = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white"
};

addColors(COLORS);

const consoleFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  format.colorize({ all: true }),
  format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const errorFileRotateTransport = new DailyRotateFile({
  level: "error",
  filename: path.join("logs", "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d",
  maxSize: "20m",
  format: fileFormat
});

const combinedFileRotateTransport = new DailyRotateFile({
  filename: path.join("logs", "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  maxSize: "20m",
  format: fileFormat
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: LEVELS,
  exitOnError: false,
  transports: [errorFileRotateTransport, combinedFileRotateTransport]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ format: consoleFormat }));
}

export default logger;
