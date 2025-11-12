import type { NextFunction, Request, Response } from "express";

import { ErrorResponse } from "@/core/responses/error";

export const handleNotFound = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // I18n.Key is now global - no import needed!
  const message = req.t("common:errors.notFound");
  const error = new ErrorResponse(message, 404);
  next(error);
};

export const handleError = (
  error: ErrorResponse,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof ErrorResponse ? error.getStatus() : 500;
  const message = error.message || req.t("common:errors.internalServer");

  return res.status(statusCode).json({
    status: "Error",
    code: statusCode,
    message
  });
};
