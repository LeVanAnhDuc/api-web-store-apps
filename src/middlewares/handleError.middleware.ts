import type { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../responses/error.response";

export const handleNotFound = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new ErrorResponse("Not Found", 404);
  next(error);
};

export const handleError = (
  error: ErrorResponse,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof ErrorResponse ? error.getStatus() : 500;

  return res.status(statusCode).json({
    status: "Error",
    code: statusCode,
    message: error.message || "Internal Server error"
  });
};
