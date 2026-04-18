// types
import type { NextFunction, Request, Response } from "express";
// config
import { ErrorResponse } from "@/config/responses/error";
import { STATUS_CODES } from "@/config/http";

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
  if (err instanceof ErrorResponse) {
    const body: ErrorPattern = {
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...(err.errors.length > 0 && { errors: err.errors })
    };

    return res.status(err.status).json(body);
  }

  const body: ErrorPattern = {
    code: "INTERNAL_SERVER_ERROR",
    message: req.t("common:errors.internalServer"),
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(body);
};
