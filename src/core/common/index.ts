import type { NextFunction, Request, Response } from "express";

export interface CanActivate {
  canActivate(req: Request): boolean | void | Promise<boolean | void>;
}

export interface Middleware {
  use(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
