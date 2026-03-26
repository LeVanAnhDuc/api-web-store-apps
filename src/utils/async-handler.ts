import type { NextFunction, Request, Response } from "express";
import type { HandlerResult } from "@/types/http";
import { STATUS_CODES } from "@/config/http";
import { DatabaseError } from "@/config/responses/error";

type ControllerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<HandlerResult | void>;

type MiddlewareFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

function isHandlerResult(
  result: HandlerResult | void
): result is HandlerResult {
  return result !== undefined && result !== null;
}

export const asyncHandler =
  (fn: ControllerFn) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await fn(req, res, next);

      if (isHandlerResult(result)) {
        result.cookies?.forEach(({ name, value, options }) =>
          res.cookie(name, value, options)
        );
        result.clearCookies?.forEach(({ name, options }) =>
          res.clearCookie(name, options)
        );

        if (result.statusCode === STATUS_CODES.NO_CONTENT) {
          res.status(result.statusCode).end();
        } else {
          res.status(result.statusCode ?? STATUS_CODES.OK).json({
            timestamp: new Date().toISOString(),
            route: req.originalUrl,
            message: result.message ?? "",
            data: result.data ?? null
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };

export async function asyncDatabaseHandler<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new DatabaseError(operation, error);
  }
}

export const asyncMiddlewareHandler =
  (middleware: MiddlewareFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, next)
      .then(() => next())
      .catch((error) => next(error));
  };
