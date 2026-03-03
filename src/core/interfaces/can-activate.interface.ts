import type { Request } from "express";

export interface CanActivate {
  canActivate(req: Request): boolean | Promise<boolean>;
}
