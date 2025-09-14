import { NextFunction, Request, Response } from 'express';

export const asyncHandler = (fn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => next(error));
  };
};

export const asyncMiddlewareHandler =
  (middleware) => (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, next)
      .then(() => next())
      .catch((error) => next(error));
  };
