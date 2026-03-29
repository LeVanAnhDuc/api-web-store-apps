// libs
import type { Request, Response } from "express";
// types
import type { LogoutService } from "./logout.service";
// config
import { NoContentSuccess } from "@/config/responses/success";
import ENV from "@/config/env";
// others
import { REFRESH_TOKEN } from "@/constants/modules/token";

export class LogoutController {
  constructor(private readonly service: LogoutService) {}

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.service.logout(req);

    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    new NoContentSuccess().send(req, res);
  };
}
