// types
import type { Request, Response, NextFunction } from "express";
// others
import { Logger } from "@/utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  Logger.http(`${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    body: req.body,
    query: req.query,
    params: req.params
  });

  res.on("finish", () => {
    const duration_ms = Date.now() - startTime;
    Logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      requestId: req.requestId,
      duration_ms,
      statusCode: res.statusCode
    });
  });

  next();
};
