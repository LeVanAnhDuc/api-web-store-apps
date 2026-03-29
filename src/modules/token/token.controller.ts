// types
import type { Request, Response } from "express";
import type { TokenService } from "./token.service";
// config
import { OkSuccess } from "@/config/responses/success";

export class TokenController {
  constructor(private readonly service: TokenService) {}

  refreshToken = (req: Request, res: Response): void => {
    const data = this.service.refreshAccessToken(
      req.cookies?.refreshToken,
      req.t
    );
    new OkSuccess({ data, message: "login:success.tokenRefreshed" }).send(
      req,
      res
    );
  };
}
