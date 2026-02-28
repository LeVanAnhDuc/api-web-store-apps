import { Router } from "express";
import type { Request, Response } from "express";
import type { TokenService } from "./token.service";
import { OkSuccess } from "@/configurations/responses/success";
import { asyncHandler } from "@/utils/async-handler";

export class TokenController {
  public readonly router = Router();

  constructor(private readonly service: TokenService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/refresh", asyncHandler(this.refreshToken));
  }

  private refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { data, message } = this.service.refreshAccessToken(req);
    new OkSuccess({ data, message }).send(req, res);
  };
}
