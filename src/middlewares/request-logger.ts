import type { Request, Response, NextFunction } from "express";
import { Logger } from "@/utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  Logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    body: req.body,
    query: req.query,
    params: req.params
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    Logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });
  });

  next();
};
