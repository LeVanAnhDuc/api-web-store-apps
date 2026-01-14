import type { NextFunction, Request, Response } from "express";

import { ErrorResponse, ValidationError } from "@/infra/responses/error";
import { STATUS_CODES } from "@/infra/http";

export const handleNotFound = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const message = req.t("common:errors.notFound");

  const error = new ErrorResponse({
    code: "NOT_FOUND",
    message,
    status: STATUS_CODES.NOT_FOUND
  });

  next(error);
};

export const handleError = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ValidationError) {
    const {
      error,
      fields,
      route = req.originalUrl,
      status,
      timestamp = new Date().toISOString()
    } = err;

    return res.status(status).json({
      timestamp,
      route,
      error: {
        ...error,
        fields
      }
    });
  }

  if (err instanceof ErrorResponse) {
    const {
      error,
      route = req.originalUrl,
      status,
      timestamp = new Date().toISOString()
    } = err;

    return res.status(status).json({ timestamp, route, error });
  }

  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    timestamp: new Date().toISOString(),
    route: req.originalUrl,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: req.t("common:errors.internalServer")
    }
  });
};
