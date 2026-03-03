import { Router } from "express";
import type { Request } from "express";
import type { HandlerResult } from "@/types/http";
import type { TokenService } from "./token.service";
import { asyncHandler } from "@/utils/async-handler";

export class TokenController {
  public readonly router = Router();

  constructor(private readonly service: TokenService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/refresh", asyncHandler(this.refreshToken));
  }

  private refreshToken = async (req: Request): Promise<HandlerResult> => {
    const { data, message } = this.service.refreshAccessToken(req);
    return { data, message };
  };
}
