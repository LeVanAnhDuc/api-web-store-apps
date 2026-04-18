// types
import type { Response } from "express";
import type { LogoutRequest } from "@/types/modules/logout";
import type { LogoutService } from "./logout.service";
// config
import { NoContentSuccess } from "@/config/responses/success";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "@/config/cookie";
// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class LogoutController {
  constructor(private readonly service: LogoutService) {}

  logout = async (req: LogoutRequest, res: Response): Promise<void> => {
    await this.service.logout(req.user!.sub);

    res.clearCookie(REFRESH_TOKEN, REFRESH_TOKEN_COOKIE_OPTIONS);

    new NoContentSuccess().send(req, res);
  };
}
