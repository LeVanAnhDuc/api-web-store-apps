// libs
import type { Request, Response, NextFunction } from "express";
// others
import { Logger } from "@/core/utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  Logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    Logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });
  });

  next();
};
