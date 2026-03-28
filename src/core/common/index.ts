import type { Request } from "express";

export interface CanActivate {
  canActivate(req: Request): boolean | void | Promise<boolean | void>;
}
