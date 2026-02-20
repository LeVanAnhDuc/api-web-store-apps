import type { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((error) => next(error));
  };

export const asyncMiddlewareHandler =
  (middleware: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, next)
      .then(() => next())
      .catch((error) => next(error));
  };
