// types
import type { Request, Response } from "express";
import type { TokenService } from "./token.service";
// config
import { OkSuccess } from "@/config/responses/success";

export class TokenController {
  constructor(private readonly service: TokenService) {}

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.refreshAccessToken(
      req.cookies?.refreshToken,
      req.t
    );
    new OkSuccess({ data, message: "login:success.tokenRefreshed" }).send(
      req,
      res
    );
  };
}
