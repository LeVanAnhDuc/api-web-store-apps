// types
import type { NextFunction, Request, Response } from "express";
// config
import { DatabaseError } from "@/config/responses/error";
// others
import Logger from "@/utils/logger";

type ControllerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const asyncHandler =
  (fn: ControllerFn) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
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
    Logger.error(`Database operation failed: ${operation}`, error);
    throw new DatabaseError(operation, error);
  }
}
